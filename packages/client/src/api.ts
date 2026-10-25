import type { Answers, BookingStatus, Currency, PayMethod, Concept, CourseLevel, FailReason, LessonPart, LevelConfig, Program, SubjectId, Theme } from '@kidsland/shared';

export interface AdminLetter {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  error: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface AdminPayment {
  id: string;
  kind: string;
  title: string;
  amount: number;
  amountShown: number;
  currency: string;
  method: string | null;
  receiptNo: number | null;
  createdAt: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  role: 'parent' | 'tutor' | 'admin';
  phone?: string | null;
  isPremium: boolean;
}

export interface Child {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  coins: number;
  xp: number;
  /** Homework bonuses; BONUS_FOR_DISCOUNT of them buy a half-price lesson. */
  bonus: number;
  completedLevels: string[];
}

export interface LevelSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: Theme;
  order: number;
  isPremium: boolean;
  xpReward: number;
  concepts: Concept[];
  stars: number;
  completed: boolean;
  unlocked: boolean;
  paywalled: boolean;
}

export interface LevelDetail extends LevelSummary {
  config: LevelConfig;
}

export interface AttemptResult {
  success: boolean;
  failReason: FailReason | null;
  stars: number;
  bestStars: number;
  score: number;
  blocksUsed: number;
  rewards: { xp: number; coins: number };
  child: { xp: number; coins: number };
}

export interface Tutor {
  id: string;
  displayName: string;
  headline: string;
  bio: string;
  videoUrl: string | null;
  avatar: string | null;
  subjects: string[];
  languages: string[];
  ageMin: number;
  ageMax: number;
  hourlyRate: number;
  /** Lesson price in shekels, from the number of pupils. */
  price: number;
  students: number;
  online: boolean;
  isNew: boolean;
  rating: number;
  reviewsCount: number;
  isPublished: boolean;
  verification?: VerificationStatus;
  nextSlot?: string | null;
  freeSlots?: number;
}

export interface TutorReview {
  id: string;
  author: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface LessonPackage {
  id: string;
  plan: string;
  source: 'pack' | 'subscription' | 'transfer';
  isTrial: boolean;
  lessonsTotal: number;
  lessonsLeft: number;
  perLesson: number;
  discount: number;
  tutor: { id: string; displayName: string } | null;
  createdAt: string;
}

export interface Billing {
  lessonsLeft: number;
  wallet: number;
  trialAvailable: boolean;
  children: { id: string; nickname: string; bonus: number }[];
  packages: LessonPackage[];
  subscription: { lessonsPerMonth: number; nextLessons: number | null; status: 'active' | 'cancelled'; periodEnd: string; tutor: { id: string; displayName: string } | null } | null;
  payments: Payment[];
  settings: { currency: Currency; payMethod: PayMethod; timezone: string | null };
}

export interface Payment {
  id: string;
  kind: 'pack' | 'subscription' | 'transfer';
  title: string;
  /** In shekels. */
  amount: number;
  /** In the currency the family saw. */
  amountShown: number;
  currency: Currency;
  method: PayMethod | null;
  receiptNo: number | null;
  createdAt: string;
}

export type PayChoice = { method: PayMethod; currency: Currency };

export interface Receipt {
  id: string;
  receiptNo: number;
  title: string;
  amount: number;
  amountShown: number;
  currency: Currency;
  method: PayMethod | null;
  email: string;
  createdAt: string;
}

export interface Slot {
  id: string;
  startsAt: string;
  durationMin: number;
  booked?: boolean;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  startsAt: string;
  durationMin: number;
  isTrial: boolean;
  price: number;
  meetingLink: string;
  tutor: { id: string; displayName: string; avatar: string | null };
  child: { id: string; nickname: string; avatarUrl: string | null };
  cancellation: { by: 'parent' | 'tutor'; reason: string; label: string; note: string | null } | null;
}

export interface ChildReport {
  child: Child;
  levels: {
    slug: string;
    title: string;
    theme: Theme;
    order: number;
    isPremium: boolean;
    concepts: Concept[];
    stars: number;
    attempts: number;
    completed: boolean;
    completedAt: string | null;
    lastPlayedAt: string | null;
  }[];
  concepts: Partial<Record<Concept, { done: number; total: number }>>;
  totals: { completed: number; levels: number; stars: number; attempts: number };
  baseCourseCompleted: boolean;
  lastPlayedAt: string | null;
  courses: CourseSummary[];
  lessons: { courseId: string; lessonId: string; score: number; max: number; completedAt: string }[];
}

export interface CourseSummary {
  courseId: string;
  subject: SubjectId;
  level: CourseLevel;
  title: string;
  lessons: number;
  completed: number;
  started: boolean;
}

export interface LessonProgress {
  courseId: string;
  lessonId: string;
  bestScore: number;
  maxScore: number;
  attempts: number;
  completed: boolean;
}

export interface HomeworkResult {
  score: number;
  max: number;
  passed: boolean;
  results: Record<string, boolean>;
  earned: number;
  bonus: number;
}

export interface LessonResult {
  score: number;
  max: number;
  passed: boolean;
  results: Record<string, boolean>;
  rewards: { xp: number; coins: number };
  progress: LessonProgress;
  child: { xp: number; coins: number };
}

export interface SupportMessage {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
}

export interface SupportThread {
  id: string;
  status: 'open' | 'closed';
  userUnread: boolean;
  staffUnread: boolean;
  updatedAt: string;
  user?: { id: string; email: string; role: User['role'] };
  lastMessage?: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected';
  reviewNote?: string | null;
  reviewedAt?: string | null;
  author?: { id: string; email: string; role: User['role'] };
}

export interface SafetyFlag {
  id: string;
  context: string;
  body: string;
  reason: string;
  createdAt: string;
  user: { id: string; email: string; role: User['role'] } | null;
}

export type VerificationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface EducationItem {
  institution: string;
  specialty: string;
  yearFrom: number;
  yearTo: number | null;
}

export interface ExperienceItem {
  place: string;
  position: string;
  yearFrom: number;
  yearTo: number | null;
}

export interface TutorApplication {
  status: VerificationStatus;
  note: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  education: EducationItem[];
  experience: ExperienceItem[];
}

export type DocumentKind = 'diploma' | 'certificate' | 'identity' | 'other';

export interface TutorDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  mime: string;
  size: number;
  createdAt: string;
}

export interface AdminApplication {
  tutor: {
    id: string;
    email: string;
    displayName: string;
    headline: string;
    bio: string;
    subjects: string[];
    languages: string[];
    ageMin: number;
    ageMax: number;
    hourlyRate: number;
    videoUrl: string | null;
    isPublished: boolean;
  };
  application: TutorApplication;
  documents: TutorDocument[];
}

export interface AdminNotification {
  id: string;
  kind: 'support' | 'tutor-application' | 'post' | 'safety';
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  read: boolean;
}

export interface LessonChat {
  bookingId: string;
  startsAt: string;
  status: BookingStatus;
  tutorName: string;
  childName: string | null;
  messages: number;
  lastAt: string;
}

export type ContentBlock = { title?: string; text: string; tip?: string };

export interface ContentOverridesDto {
  topics: { id: string; section: string; name: string }[];
  articles: { id: string; section: string; topic: string; title: string; summary: string; minutes: number; sections: ContentBlock[]; hidden?: boolean }[];
  lessons: { lessonId: string; title: string; sections: ContentBlock[] }[];
}

export type ArticleInput = { section: string; topic: string; title: string; summary: string; minutes: number; sections: ContentBlock[] };

export interface Stroke {
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
  points: [number, number][];
}

export interface RoomMessage {
  id: string;
  body: string;
  isTutor: boolean;
  createdAt: string;
}

export interface RoomState {
  messages: RoomMessage[];
  board: { version: number; strokes: Stroke[] } | null;
  youAreTutor: boolean;
}

export type TutorProfileInput = Pick<
  Tutor,
  'displayName' | 'headline' | 'bio' | 'subjects' | 'languages' | 'ageMin' | 'ageMax' | 'hourlyRate' | 'isPublished'
> & { videoUrl: string; avatar?: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const TOKEN_KEY = 'kidsland.token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string | null) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  },
};

async function request<T>(path: string, init: { method?: string; body?: unknown; file?: File } = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'Content-Type': init.file ? init.file.type : 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.file ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
    });
  } catch {
    throw new ApiError(0, 'Нет связи с сайтом. Проверьте интернет или перезапустите npm run dev:client.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  // No JSON body means the API itself did not answer (e.g. the dev proxy could not reach it).
  if (!data) throw new ApiError(res.status, 'Сервер не отвечает. Проверьте, что запущен npm run dev:server.');
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Что-то пошло не так');
  return data as T;
}

/** Opens a file that needs the sign-in token (private documents) in a new tab. */
export async function openPrivateFile(path: string) {
  const win = window.open('', '_blank');
  const token = tokenStore.get();
  const res = await fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    win?.close();
    throw new ApiError(res.status, 'Не удалось открыть документ');
  }
  const url = URL.createObjectURL(await res.blob());
  if (win) win.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const api = {
  register: (email: string, password: string, role: 'parent' | 'tutor' = 'parent', displayName?: string, phone?: string) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: { email, password, role, displayName, phone: phone || undefined } }),
  setPhone: (phone: string) => request<{ user: User }>('/auth/me', { method: 'PATCH', body: { phone } }),
  pushKey: () => request<{ publicKey: string }>('/push/key'),
  pushSubscribe: (sub: PushSubscriptionJSON) => request<{ ok: true }>('/push/subscribe', { method: 'POST', body: sub }),
  pushUnsubscribe: (endpoint: string) => request<{ ok: true }>('/push/unsubscribe', { method: 'POST', body: { endpoint } }),
  pushTest: () => request<{ sent: number }>('/push/test', { method: 'POST' }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request<{ user: User }>('/auth/me'),
  publicLevels: () => request<{ levels: LevelSummary[] }>('/levels'),
  publicLevel: (slug: string) => request<{ level: LevelDetail; savedProgram: Program | null }>(`/levels/${slug}`),
  children: () => request<{ children: Child[] }>('/children'),
  createChild: (nickname: string, avatarUrl: string) =>
    request<{ child: Child }>('/children', { method: 'POST', body: { nickname, avatarUrl } }),
  levels: (childId: string) => request<{ levels: LevelSummary[] }>(`/children/${childId}/levels`),
  level: (childId: string, slug: string) =>
    request<{ level: LevelDetail; savedProgram: Program | null }>(`/children/${childId}/levels/${slug}`),
  submit: (childId: string, levelSlug: string, program: Program) =>
    request<AttemptResult>(`/children/${childId}/attempts`, { method: 'POST', body: { levelSlug, program } }),
  report: (childId: string) => request<ChildReport>(`/children/${childId}/report`),

  tutors: (filters: { subject?: string; section?: string; language?: string; age?: number; sort?: string }) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') q.set(k, String(v));
    return request<{ tutors: Tutor[] }>(`/tutors?${q}`);
  },
  tutor: (id: string) => request<{ tutor: Tutor; slots: Slot[] }>(`/tutors/${id}`),
  bookings: () => request<{ bookings: Booking[] }>('/bookings'),
  booking: (id: string) => request<{ booking: Booking }>(`/bookings/${id}`),
  book: (slotId: string, childId: string) =>
    request<{ booking: Booking }>('/bookings', { method: 'POST', body: { slotId, childId } }),
  billing: () => request<Billing>('/billing'),
  buyPack: (plan: string, tutorId: string, pay?: PayChoice) => request<Billing>('/billing/buy', { method: 'POST', body: { plan, tutorId, pay } }),
  subscribe: (lessonsPerMonth: number, tutorId: string, pay?: PayChoice) =>
    request<Billing>('/billing/subscription', { method: 'POST', body: { lessonsPerMonth, tutorId, pay } }),
  billingSettings: (s: { currency?: Currency; payMethod?: PayMethod; timezone?: string }) => request<Billing>('/billing/settings', { method: 'PUT', body: s }),
  receipt: (id: string) => request<Receipt>(`/billing/receipts/${id}`),
  cancelSubscription: () => request<Billing>('/billing/subscription/cancel', { method: 'POST' }),
  resumeSubscription: () => request<Billing>('/billing/subscription/resume', { method: 'POST' }),
  moveSubscription: (tutorId: string) => request<Billing>('/billing/subscription/tutor', { method: 'POST', body: { tutorId } }),
  transferLessons: (packageId: string, toTutorId: string, lessons: number) =>
    request<Billing>('/billing/transfer', { method: 'POST', body: { packageId, toTutorId, lessons } }),
  tutorReviews: (id: string) => request<{ reviews: TutorReview[] }>(`/tutors/${id}/reviews`),
  addReview: (id: string, r: { rating: number; body: string; author: string }) => request<{ ok: true }>(`/tutors/${id}/reviews`, { method: 'POST', body: r }),
  tutorPing: () => request<void>('/tutor/ping', { method: 'POST' }),
  cancelBooking: (id: string, reason: string, note: string) =>
    request<{ booking: Booking }>(`/bookings/${id}/cancel`, { method: 'POST', body: { reason, note } }),

  myTutorProfile: () => request<{ tutor: Tutor }>('/tutor/profile'),
  saveTutorProfile: (p: TutorProfileInput) => request<{ tutor: Tutor }>('/tutor/profile', { method: 'PUT', body: p }),
  mySlots: () => request<{ slots: Slot[] }>('/tutor/slots'),
  addSlots: (startsAt: string[], durationMin = 45) =>
    request<{ added: number }>('/tutor/slots', { method: 'POST', body: { startsAt, durationMin } }),
  deleteSlot: (id: string) => request<void>(`/tutor/slots/${id}`, { method: 'DELETE' }),
  uploadVideo: (file: File) => request<{ tutor: Tutor }>('/tutor/video', { method: 'POST', file }),
  deleteVideo: () => request<{ tutor: Tutor }>('/tutor/video', { method: 'DELETE' }),
  myApplication: () => request<{ application: TutorApplication; documents: TutorDocument[] }>('/tutor/application'),
  saveApplication: (a: { education: EducationItem[]; experience: ExperienceItem[] }) =>
    request<{ application: TutorApplication }>('/tutor/application', { method: 'PUT', body: a }),
  uploadDocument: (file: File, kind: DocumentKind, title: string) =>
    request<{ document: TutorDocument }>(`/tutor/documents?${new URLSearchParams({ kind, title })}`, { method: 'POST', file }),
  deleteDocument: (id: string) => request<void>(`/tutor/documents/${id}`, { method: 'DELETE' }),
  submitApplication: () => request<{ application: TutorApplication; tutor: Tutor }>('/tutor/application/submit', { method: 'POST' }),

  content: () => request<ContentOverridesDto>('/content'),
  adminMail: (status?: 'pending' | 'sent' | 'failed') =>
    request<{ letters: AdminLetter[]; counts: Partial<Record<'pending' | 'sent' | 'failed', number>>; mailReady: boolean }>(`/admin/mail${status ? `?status=${status}` : ''}`),
  adminPayments: () => request<{ payments: AdminPayment[]; month: number }>('/admin/payments'),
  adminNotifications: () => request<{ unread: number; notifications: AdminNotification[] }>('/admin/notifications'),
  readNotifications: (ids?: string[]) => request<{ ok: true }>('/admin/notifications/read', { method: 'POST', body: { ids } }),
  tutorApplications: (status: VerificationStatus | 'all') =>
    request<{ applications: AdminApplication[] }>(`/admin/tutor-applications?status=${status}`),
  reviewTutor: (tutorId: string, decision: 'approve' | 'reject', note: string) =>
    request<AdminApplication>(`/admin/tutor-applications/${tutorId}/review`, { method: 'POST', body: { decision, note } }),
  lessonChats: () => request<{ chats: LessonChat[] }>('/admin/lesson-chats'),
  lessonChat: (bookingId: string) => request<{ messages: RoomMessage[] }>(`/admin/lesson-chats/${bookingId}`),
  adminContent: () => request<ContentOverridesDto>('/admin/content'),
  addTopic: (section: string, name: string) =>
    request<ContentOverridesDto>('/admin/content/topics', { method: 'POST', body: { section, name } }),
  deleteTopic: (id: string) => request<ContentOverridesDto>(`/admin/content/topics/${id}`, { method: 'DELETE' }),
  createArticle: (a: ArticleInput) => request<{ id: string; content: ContentOverridesDto }>('/admin/content/articles', { method: 'POST', body: a }),
  saveArticle: (id: string, a: ArticleInput) =>
    request<{ id: string; content: ContentOverridesDto }>(`/admin/content/articles/${id}`, { method: 'PUT', body: a }),
  hideArticle: (id: string, hidden: boolean) =>
    request<ContentOverridesDto>(`/admin/content/articles/${id}/hidden`, { method: 'POST', body: { hidden } }),
  saveLesson: (lessonId: string, l: { title: string; sections: ContentBlock[] }) =>
    request<ContentOverridesDto>(`/admin/content/lessons/${lessonId}`, { method: 'PUT', body: l }),
  resetLesson: (lessonId: string) => request<ContentOverridesDto>(`/admin/content/lessons/${lessonId}`, { method: 'DELETE' }),

  courseProgress: (childId: string) =>
    request<{ progress: LessonProgress[]; courses: CourseSummary[] }>(`/children/${childId}/courses`),
  submitLesson: (childId: string, lessonId: string, answers: Answers, part?: LessonPart) =>
    request<LessonResult>(`/children/${childId}/lessons/${lessonId}/submit`, { method: 'POST', body: { answers, part } }),
  homework: (childId: string, lessonId: string) =>
    request<{ results: Record<string, boolean>; attempts: number; earned: number; bonus: number }>(`/children/${childId}/homework/${lessonId}`),
  submitHomework: (childId: string, lessonId: string, answers: Answers) =>
    request<HomeworkResult>(`/children/${childId}/homework/${lessonId}`, { method: 'POST', body: { answers } }),
  bonusLesson: (childId: string, tutorId: string, pay?: PayChoice) => request<Billing>('/billing/bonus', { method: 'POST', body: { childId, tutorId, pay } }),
  completeLesson: (childId: string, lessonId: string) =>
    request<{ progress: LessonProgress }>(`/children/${childId}/lessons/${lessonId}/complete`, { method: 'POST', body: {} }),

  support: () => request<{ thread: SupportThread | null; messages: SupportMessage[] }>('/support'),
  sendSupport: (body: string) =>
    request<{ thread: SupportThread; messages: SupportMessage[] }>('/support/messages', { method: 'POST', body: { body } }),
  adminThreads: () => request<{ threads: SupportThread[] }>('/support/admin/threads'),
  adminThread: (id: string) => request<{ thread: SupportThread; messages: SupportMessage[] }>(`/support/admin/threads/${id}`),
  adminReply: (id: string, body: string) =>
    request<{ thread: SupportThread; messages: SupportMessage[] }>(`/support/admin/threads/${id}/messages`, { method: 'POST', body: { body } }),
  adminSetStatus: (id: string, status: 'open' | 'closed') =>
    request<{ thread: SupportThread }>(`/support/admin/threads/${id}/status`, { method: 'POST', body: { status } }),
  safetyFlags: () => request<{ flags: SafetyFlag[] }>('/support/admin/safety-flags'),
  posts: () => request<{ posts: CommunityPost[] }>('/posts'),
  myPosts: () => request<{ posts: CommunityPost[] }>('/posts/mine'),
  changePassword: (current: string, next: string) => request<{ ok: true }>('/auth/password', { method: 'POST', body: { current, next } }),
  createPost: (post: { authorName: string; title: string; body: string }) =>
    request<{ post: CommunityPost }>('/posts', { method: 'POST', body: post }),
  adminPosts: (status: 'pending' | 'approved' | 'rejected') => request<{ posts: CommunityPost[] }>(`/posts/admin?status=${status}`),
  reviewPost: (id: string, decision: 'approve' | 'reject', note?: string) =>
    request<{ post: CommunityPost }>(`/posts/admin/${id}/review`, { method: 'POST', body: { decision, note } }),

  room: (bookingId: string, after: string | null, board: number) => {
    const q = new URLSearchParams({ board: String(board) });
    if (after) q.set('after', after);
    return request<RoomState>(`/bookings/${bookingId}/room?${q}`);
  },
  sendRoomMessage: (bookingId: string, body: string) =>
    request<{ message: RoomMessage }>(`/bookings/${bookingId}/messages`, { method: 'POST', body: { body } }),
  addStroke: (bookingId: string, stroke: Stroke) =>
    request<{ version: number }>(`/bookings/${bookingId}/board`, { method: 'POST', body: { stroke } }),
  clearBoard: (bookingId: string) => request<{ version: number }>(`/bookings/${bookingId}/board/clear`, { method: 'POST' }),
};
