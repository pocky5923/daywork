import { pool } from '@/lib/db';
import { getActor,apiFailure,HttpError } from '@/lib/access';
export async function GET(){try{const a=await getActor();if(a.role!=='admin')throw new HttpError(403,'限最高管理員');const {rows}=await pool.query('SELECT id,action,resource,resource_id,created_at FROM audit_records ORDER BY created_at DESC LIMIT 200');return Response.json({records:rows})}catch(e){return apiFailure(e)}}
