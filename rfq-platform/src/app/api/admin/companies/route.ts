import { pool } from '@/lib/db';
import { getActor,apiFailure,HttpError } from '@/lib/access';
export async function GET(){try{const a=await getActor();if(a.role==='vendor')throw new HttpError(403,'不開放廠商名冊');const {rows}=await pool.query('SELECT id,name FROM companies ORDER BY name');return Response.json({companies:rows})}catch(e){return apiFailure(e)}}
