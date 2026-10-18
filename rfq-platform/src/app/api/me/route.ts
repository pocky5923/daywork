import { getActor,apiFailure } from '@/lib/access';
export async function GET(){try{return Response.json({actor:await getActor()},{headers:{'Cache-Control':'no-store'}})}catch(e){return apiFailure(e)}}
