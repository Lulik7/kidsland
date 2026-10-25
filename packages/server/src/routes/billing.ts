import { BONUS_DISCOUNT, BONUS_FOR_DISCOUNT, formatMoney, inCurrency, PACKS, PAY_METHODS, type Currency, subscriptionStep, SUBSCRIPTION_STEPS, withDiscount, type PackId } from '@kidsland/shared';
import { Router } from 'express';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { config } from '../config';
import { queueMail } from '../mail';
import { notifyAdmins } from '../notify';
import { isUuid, priceOfTutor } from '../tutors';

type Q = Db | PoolClient;

const METHOD_NAME: Record<string, string> = Object.fromEntries(PAY_METHODS.map((m) => [m.id, m.name]));

/**
 * Records a (demo) payment in the family's currency and with their payment method; money left on the
 * family's balance is used first. The parent and the site's admins get a confirmation letter with the receipt.
 */
async function charge(db: Q, parentId: string, kind: 'pack' | 'subscription', title: string, amount: number) {
  const { rows } = await db.query('SELECT email, wallet, currency, pay_method FROM users WHERE id = $1', [parentId]);
  const user = rows[0];
  const fromWallet = Math.min(user?.wallet ?? 0, amount);
  if (fromWallet) await db.query('UPDATE users SET wallet = wallet - $2 WHERE id = $1', [parentId, fromWallet]);
  const currency = (user?.currency ?? 'ILS') as Currency;
  const paid = amount - fromWallet;
  const { rows: pay } = await db.query(
    `INSERT INTO payments (parent_id, kind, title, amount, method, currency, amount_shown, receipt_no)
     VALUES ($1, $2, $3, $4, $5, $6, $7, nextval('receipt_no_seq')) RETURNING id, receipt_no`,
    [
      parentId,
      kind,
      fromWallet ? `${title} (${formatMoney(fromWallet, currency)} с баланса)` : title,
      paid,
      paid ? user?.pay_method ?? 'card' : null,
      currency,
      inCurrency(paid, currency),
    ],
  );
  if (!user) return;
  const sum = formatMoney(paid, currency);
  const link = `${config.appUrl}/billing/receipt/${pay[0].id}`;
  const body = [
    `Квитанция № ${pay[0].receipt_no}`,
    `Дата: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Jerusalem' })}`,
    `Плательщик: ${user.email}`,
    `За что: ${title}`,
    `Сумма: ${sum}${currency === 'ILS' ? '' : ` (${paid} ₪)`}`,
    `Способ оплаты: ${paid ? METHOD_NAME[user.pay_method] ?? user.pay_method : 'с баланса'}`,
    '',
    `Квитанция на сайте: ${link}`,
    '',
    'Оплата пока учебная: деньги не списывались.',
    'Kidsland',
  ].join('\n');
  await queueMail(db, user.email, `Kidsland: оплата получена, квитанция № ${pay[0].receipt_no}`, body);
  await queueMail(db, config.notifyEmails, `Kidsland: новая оплата ${sum} от ${user.email}`, body);
  await notifyAdmins(db, 'payment', `Оплата ${sum}: ${title}`, `${user.email}, квитанция № ${pay[0].receipt_no}`, `/billing/receipt/${pay[0].id}`);
}

const addMonth = (d: Date) => {
  const n = new Date(d);
  n.setMonth(n.getMonth() + 1);
  return n;
};

/** Gives the family the lessons of every subscription month that has started since the last visit. */
export async function renewSubscription(db: Q, parentId: string) {
  const { rows } = await db.query('SELECT * FROM subscriptions WHERE parent_id = $1', [parentId]);
  const sub = rows[0];
  if (!sub || sub.status === 'ended') return;
  let end = new Date(sub.period_end);
  let lessons = sub.lessons_per_month;
  let next = sub.next_lessons;
  let status = sub.status;
  while (end.getTime() <= Date.now()) {
    if (status === 'cancelled') {
      status = 'ended';
      break;
    }
    if (next) {
      lessons = next;
      next = null;
    }
    const step = subscriptionStep(lessons) ?? SUBSCRIPTION_STEPS[0];
    const tutor = sub.tutor_id ? await priceOfTutor(db, sub.tutor_id) : null;
    if (!tutor) {
      status = 'ended';
      break;
    }
    const per = withDiscount(tutor.price, step.discount);
    await db.query(
      `INSERT INTO lesson_packages (parent_id, tutor_id, plan, source, lessons_total, lessons_left, per_lesson, discount)
       VALUES ($1, $2, $3, 'subscription', $4, $4, $5, $6)`,
      [parentId, sub.tutor_id, `sub${lessons}`, lessons, per, step.discount],
    );
    await charge(db, parentId, 'subscription', `Подписка: ${lessons} уроков в месяц, наставник ${tutor.name}`, lessons * per);
    end = addMonth(end);
  }
  await db.query('UPDATE subscriptions SET period_end = $2, lessons_per_month = $3, next_lessons = $4, status = $5 WHERE parent_id = $1', [
    parentId,
    end,
    lessons,
    next,
    status,
  ]);
}

/** Takes one paid lesson for a booking with `tutorId`: the trial first, then the oldest lessons. Null when nothing is left. */
export async function takeLesson(db: Q, parentId: string, tutorId: string) {
  await renewSubscription(db, parentId);
  const { rows: trialUsed } = await db.query("SELECT 1 FROM bookings WHERE parent_id = $1 AND is_trial AND status <> 'cancelled'", [parentId]);
  const { rows } = await db.query(
    `SELECT * FROM lesson_packages
      WHERE parent_id = $1 AND lessons_left > 0 AND tutor_id = $2
        AND (NOT is_trial OR NOT $3)
      ORDER BY is_trial DESC, created_at
      LIMIT 1 FOR UPDATE`,
    [parentId, tutorId, trialUsed.length > 0],
  );
  const pkg = rows[0];
  if (!pkg) return null;
  await db.query('UPDATE lesson_packages SET lessons_left = lessons_left - 1 WHERE id = $1', [pkg.id]);
  return { id: pkg.id as string, isTrial: pkg.is_trial as boolean, price: pkg.per_lesson as number };
}

/** A cancelled lesson goes back to the package it was paid from. */
export async function returnLesson(db: Q, packageId: string | null) {
  if (packageId) await db.query('UPDATE lesson_packages SET lessons_left = lessons_left + 1 WHERE id = $1', [packageId]);
}

const tutorId = z.string({ required_error: 'Выберите наставника' }).refine(isUuid, 'Выберите наставника');
/** How the parent pays this time; it is remembered for the next payments and the monthly subscription. */
const pay = z.object({ method: z.enum(['card', 'paypal']), currency: z.enum(['ILS', 'EUR', 'USD']) }).optional();

/** "Subscription and payment": balance, packs, subscription and moving lessons to another tutor. Payment is a demo. */
export function billingRouter(db: Db) {
  const r = Router();
  /** A receipt, for the parent who paid and for admins. */
  r.get('/receipts/:id', requireAuth, async (req, res) => {
    const id = String(req.params.id);
    if (!isUuid(id)) throw new HttpError(404, 'Квитанция не найдена');
    const { rows } = await db.query(
      'SELECT p.*, u.email FROM payments p JOIN users u ON u.id = p.parent_id WHERE p.id = $1 AND (p.parent_id = $2 OR $3)',
      [id, req.user!.id, req.user!.role === 'admin'],
    );
    const p = rows[0];
    if (!p) throw new HttpError(404, 'Квитанция не найдена');
    res.json({
      id: p.id,
      receiptNo: p.receipt_no,
      title: p.title,
      amount: p.amount,
      amountShown: p.amount_shown,
      currency: p.currency,
      method: p.method,
      email: p.email,
      createdAt: p.created_at,
    });
  });

  r.use(requireAuth, requireRole('parent'));

  const savePay = async (parentId: string, p: z.infer<typeof pay>) => {
    if (p) await db.query('UPDATE users SET pay_method = $2, currency = $3 WHERE id = $1', [parentId, p.method, p.currency]);
  };

  const checkTutor = async (id: string) => {
    const t = await priceOfTutor(db, id);
    if (!t) throw new HttpError(404, 'Наставник не найден');
    return { id, ...t };
  };

  const overview = async (parentId: string) => {
    await renewSubscription(db, parentId);
    const [packages, sub, payments, trial, wallet, kids] = await Promise.all([
      db.query(
        `SELECT p.*, t.display_name AS tutor_name FROM lesson_packages p LEFT JOIN tutor_profiles t ON t.id = p.tutor_id
          WHERE p.parent_id = $1 AND p.lessons_left > 0 ORDER BY p.created_at`,
        [parentId],
      ),
      db.query('SELECT s.*, t.display_name AS tutor_name FROM subscriptions s LEFT JOIN tutor_profiles t ON t.id = s.tutor_id WHERE s.parent_id = $1', [parentId]),
      db.query('SELECT * FROM payments WHERE parent_id = $1 ORDER BY created_at DESC LIMIT 30', [parentId]),
      db.query("SELECT 1 FROM lesson_packages WHERE parent_id = $1 AND is_trial UNION SELECT 1 FROM bookings WHERE parent_id = $1 AND is_trial", [parentId]),
      db.query('SELECT wallet, currency, pay_method, timezone FROM users WHERE id = $1', [parentId]),
      db.query('SELECT id, nickname, bonus FROM child_profiles WHERE parent_id = $1 ORDER BY created_at', [parentId]),
    ]);
    const s = sub.rows[0];
    return {
      lessonsLeft: packages.rows.reduce((n, p) => n + p.lessons_left, 0),
      wallet: wallet.rows[0]?.wallet ?? 0,
      settings: { currency: wallet.rows[0]?.currency ?? 'ILS', payMethod: wallet.rows[0]?.pay_method ?? 'card', timezone: wallet.rows[0]?.timezone ?? null },
      trialAvailable: trial.rows.length === 0,
      children: kids.rows.map((c) => ({ id: c.id, nickname: c.nickname, bonus: c.bonus })),
      packages: packages.rows.map((p) => ({
        id: p.id,
        plan: p.plan,
        source: p.source,
        isTrial: p.is_trial,
        lessonsTotal: p.lessons_total,
        lessonsLeft: p.lessons_left,
        perLesson: p.per_lesson,
        discount: p.discount,
        tutor: p.tutor_id ? { id: p.tutor_id, displayName: p.tutor_name } : null,
        createdAt: p.created_at,
      })),
      subscription:
        s && s.status !== 'ended'
          ? {
              lessonsPerMonth: s.lessons_per_month,
              nextLessons: s.next_lessons,
              status: s.status,
              periodEnd: s.period_end,
              tutor: s.tutor_id ? { id: s.tutor_id, displayName: s.tutor_name } : null,
            }
          : null,
      payments: payments.rows.map((p) => ({
        id: p.id,
        kind: p.kind,
        title: p.title,
        amount: p.amount,
        amountShown: p.amount_shown,
        currency: p.currency,
        method: p.method,
        receiptNo: p.receipt_no,
        createdAt: p.created_at,
      })),
    };
  };

  r.get('/', async (req, res) => {
    res.json(await overview(req.user!.id));
  });

  r.post('/buy', async (req, res) => {
    const body = z.object({ plan: z.enum(PACKS.map((p) => p.id) as [PackId, ...PackId[]]), tutorId, pay }).parse(req.body);
    await savePay(req.user!.id, body.pay);
    const pack = PACKS.find((p) => p.id === body.plan)!;
    const tutor = await checkTutor(body.tutorId);
    const parentId = req.user!.id;
    if (pack.id === 'trial' && !(await overview(parentId)).trialAvailable) throw new HttpError(400, 'Пробный урок со скидкой можно купить только один раз');
    const per = withDiscount(tutor.price, pack.discount);
    await db.query(
      `INSERT INTO lesson_packages (parent_id, tutor_id, plan, source, lessons_total, lessons_left, per_lesson, discount, is_trial)
       VALUES ($1, $2, $3, 'pack', $4, $4, $5, $6, $7)`,
      [parentId, tutor.id, pack.id, pack.lessons, per, pack.discount, pack.id === 'trial'],
    );
    await charge(db, parentId, 'pack', `${pack.name}, наставник ${tutor.name}`, per * pack.lessons);
    res.status(201).json(await overview(parentId));
  });

  /** Starts a subscription, or changes the number of lessons from the next month. */
  r.post('/subscription', async (req, res) => {
    const body = z
      .object({ lessonsPerMonth: z.number().int().refine((n) => !!subscriptionStep(n), 'Такого плана нет'), tutorId, pay })
      .parse(req.body);
    await savePay(req.user!.id, body.pay);
    const parentId = req.user!.id;
    await renewSubscription(db, parentId);
    const { rows } = await db.query('SELECT * FROM subscriptions WHERE parent_id = $1', [parentId]);
    const sub = rows[0];
    if (sub && sub.status !== 'ended') {
      // Already subscribed: the new size starts with the next month, the lessons of this month stay.
      await db.query("UPDATE subscriptions SET next_lessons = $2, status = 'active' WHERE parent_id = $1", [
        parentId,
        body.lessonsPerMonth === sub.lessons_per_month ? null : body.lessonsPerMonth,
      ]);
    } else {
      const tutor = await checkTutor(body.tutorId);
      await db.query(
        `INSERT INTO subscriptions (parent_id, lessons_per_month, tutor_id, status, period_end) VALUES ($1, $2, $3, 'active', now())
         ON CONFLICT (parent_id) DO UPDATE SET lessons_per_month = $2, tutor_id = $3, status = 'active', period_end = now(), next_lessons = NULL`,
        [parentId, body.lessonsPerMonth, tutor.id],
      );
      await renewSubscription(db, parentId);
    }
    res.json(await overview(parentId));
  });

  r.post('/subscription/cancel', async (req, res) => {
    await db.query("UPDATE subscriptions SET status = 'cancelled', next_lessons = NULL WHERE parent_id = $1 AND status = 'active'", [req.user!.id]);
    res.json(await overview(req.user!.id));
  });

  r.post('/subscription/resume', async (req, res) => {
    await db.query("UPDATE subscriptions SET status = 'active' WHERE parent_id = $1 AND status = 'cancelled'", [req.user!.id]);
    res.json(await overview(req.user!.id));
  });

  /** Moves some unused lessons (or all of them) to another tutor. */
  r.post('/transfer', async (req, res) => {
    const body = z
      .object({
        packageId: z.string().refine(isUuid, 'Пакет не найден'),
        toTutorId: z.string().refine(isUuid, 'Наставник не найден'),
        lessons: z.number().int().min(1).max(500),
      })
      .parse(req.body);
    const parentId = req.user!.id;
    const to = await checkTutor(body.toTutorId);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM lesson_packages WHERE id = $1 AND parent_id = $2 FOR UPDATE', [body.packageId, parentId]);
      const pkg = rows[0];
      if (!pkg) throw new HttpError(404, 'Пакет не найден');
      if (pkg.is_trial) throw new HttpError(400, 'Пробный урок можно провести с любым наставником, переносить его не нужно');
      if (pkg.tutor_id === to.id) throw new HttpError(400, 'Эти уроки уже у этого наставника');
      if (body.lessons > pkg.lessons_left) throw new HttpError(400, `В пакете осталось только ${pkg.lessons_left} ур.`);
      // The money is recounted at the new tutor's price with the same discount; the rest stays on the balance.
      const value = body.lessons * pkg.per_lesson;
      const per = withDiscount(to.price, pkg.discount);
      const lessons = Math.floor(value / per);
      const rest = value - lessons * per;
      await client.query('UPDATE lesson_packages SET lessons_left = lessons_left - $2 WHERE id = $1', [pkg.id, body.lessons]);
      if (lessons > 0) {
        await client.query(
          `INSERT INTO lesson_packages (parent_id, tutor_id, plan, source, lessons_total, lessons_left, per_lesson, discount)
           VALUES ($1, $2, $3, 'transfer', $4, $4, $5, $6)`,
          [parentId, to.id, pkg.plan, lessons, per, pkg.discount],
        );
      }
      if (rest > 0) await client.query('UPDATE users SET wallet = wallet + $2 WHERE id = $1', [parentId, rest]);
      await client.query("INSERT INTO payments (parent_id, kind, title, amount) VALUES ($1, 'transfer', $2, 0)", [
        parentId,
        `Перенос ${body.lessons} ур. (${value} ₪) к наставнику ${to.name}: ${lessons} ур.${rest ? `, ${rest} ₪ на баланс` : ''}`,
      ]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.json(await overview(parentId));
  });

  /** The family's time zone, currency and usual payment method. */
  r.put('/settings', async (req, res) => {
    const body = z
      .object({
        currency: z.enum(['ILS', 'EUR', 'USD']).optional(),
        payMethod: z.enum(['card', 'paypal']).optional(),
        timezone: z.string().max(64).refine((tz) => Intl.supportedValuesOf('timeZone').includes(tz) || tz === 'UTC', 'Неизвестный часовой пояс').optional(),
      })
      .parse(req.body);
    await db.query(
      'UPDATE users SET currency = COALESCE($2, currency), pay_method = COALESCE($3, pay_method), timezone = COALESCE($4, timezone) WHERE id = $1',
      [req.user!.id, body.currency ?? null, body.payMethod ?? null, body.timezone ?? null],
    );
    res.json(await overview(req.user!.id));
  });

  /** Gives the subscription to another tutor from the next month; this month's lessons can be moved with /transfer. */
  r.post('/subscription/tutor', async (req, res) => {
    const body = z.object({ tutorId }).parse(req.body);
    const parentId = req.user!.id;
    const to = await checkTutor(body.tutorId);
    const { rowCount } = await db.query("UPDATE subscriptions SET tutor_id = $2 WHERE parent_id = $1 AND status <> 'ended'", [parentId, to.id]);
    if (!rowCount) throw new HttpError(400, 'Подписки пока нет');
    await db.query("INSERT INTO payments (parent_id, kind, title, amount) VALUES ($1, 'transfer', $2, 0)", [parentId, `Подписка перенесена к наставнику ${to.name}`]);
    res.json(await overview(parentId));
  });

  /** A child's homework bonuses buy one lesson at half price with any tutor. */
  r.post('/bonus', async (req, res) => {
    const body = z.object({ childId: z.string().uuid(), tutorId, pay }).parse(req.body);
    await savePay(req.user!.id, body.pay);
    const parentId = req.user!.id;
    const tutor = await checkTutor(body.tutorId);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'UPDATE child_profiles SET bonus = bonus - $3 WHERE id = $1 AND parent_id = $2 AND bonus >= $3 RETURNING nickname',
        [body.childId, parentId, BONUS_FOR_DISCOUNT],
      );
      if (!rows[0]) throw new HttpError(400, `Нужно ${BONUS_FOR_DISCOUNT} бонусов за домашние задания`);
      const per = withDiscount(tutor.price, BONUS_DISCOUNT);
      await client.query(
        `INSERT INTO lesson_packages (parent_id, tutor_id, plan, source, lessons_total, lessons_left, per_lesson, discount)
         VALUES ($1, $2, 'bonus', 'pack', 1, 1, $3, $4)`,
        [parentId, tutor.id, per, BONUS_DISCOUNT],
      );
      await charge(client, parentId, 'pack', `Урок за бонусы (${rows[0].nickname}), наставник ${tutor.name}`, per);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.status(201).json(await overview(parentId));
  });

  return r;
}
