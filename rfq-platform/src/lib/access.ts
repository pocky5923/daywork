import { headers } from 'next/headers';
import { auth } from './auth';
import { pool, isConfigured } from './db';

export type Role = 'admin' | 'engineer' | 'vendor';
export type Actor = { id: string; email: string; name: string; role: Role; companyId: string | null; expiresAt: string };
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function requireConfigured() {
  if (!isConfigured()) throw new HttpError(503, '後端尚未完成資料庫與身分驗證設定');
}
export async function getActor(): Promise<Actor> {
  requireConfigured();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || new Date(session.session.expiresAt).getTime() <= Date.now()) {
    throw new HttpError(401, '登入已失效，請重新登入');
  }
  const result = await pool.query('SELECT role, company_id, active FROM profiles WHERE user_id=$1', [session.user.id]);
  const profile = result.rows[0] as { role: Role; company_id: string | null; active: boolean } | undefined;
  const authRoles = String((session.user as { role?: string }).role || '').split(',');
  const isAuthAdmin = authRoles.includes('admin');
  if (!profile && !isAuthAdmin) throw new HttpError(403, '帳號尚未完成權限設定');
  if (profile && !profile.active) throw new HttpError(403, '此帳號已停用');
  const role = profile?.role || (isAuthAdmin ? 'admin' : undefined);
  if (!role || (role === 'admin' && !isAuthAdmin)) throw new HttpError(403, '身分未授權');
  if (role === 'vendor' && !profile?.company_id) throw new HttpError(403, '廠商尚未指定公司');
  return { id: session.user.id, email: session.user.email, name: session.user.name, role, companyId: profile?.company_id || null, expiresAt: new Date(session.session.expiresAt).toISOString() };
}
export async function readProject(actor: Actor, id: string): Promise<Record<string, any>> {
  const result = await pool.query('SELECT * FROM projects WHERE id=$1', [id]);
  const project = result.rows[0];
  if (!project) throw new HttpError(404, '查無此專案');
  if (actor.role === 'engineer' && project.owner_id !== actor.id) throw new HttpError(404, '查無此專案');
  if (actor.role === 'vendor') {
    if (project.status !== 'published' || !actor.companyId) throw new HttpError(404, '查無此專案');
    const invite = await pool.query('SELECT 1 FROM project_invitations WHERE project_id=$1 AND company_id=$2', [id, actor.companyId]);
    if (!invite.rowCount) throw new HttpError(404, '查無此專案');
  }
  return project;
}
export function requireManager(actor: Actor, project: Record<string, any>) {
  if (actor.role !== 'admin' && !(actor.role === 'engineer' && project.owner_id === actor.id)) throw new HttpError(403, '沒有管理此專案的權限');
}
export function apiFailure(error: unknown): Response {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
  console.error('Protected endpoint error:', error);
  return Response.json({ error: '伺服器處理失敗' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
}
export async function audit(actor: Actor, action: string, resource: string, id: string) {
  await pool.query('INSERT INTO audit_records(actor_id,action,resource,resource_id) VALUES ($1,$2,$3,$4)', [actor.id, action, resource, id]);
}
