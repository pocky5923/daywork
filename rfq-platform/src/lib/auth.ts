import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { pool } from './db';
import { sendMail } from './email';

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    resetPasswordTokenExpiresIn: 60 * 60 * 24,
    sendResetPassword: async ({ user, url }) => {
      const safeUrl = url.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
      await sendMail(
        user.email,
        'SpecBridge 工程詢價系統｜設定密碼',
        '<div style="font:16px sans-serif;color:#1c2d40"><h2>SpecBridge 工程詢價平台</h2><p>管理員已為你建立登入帳號。請點選下方連結設定密碼：</p><p><a href="' + safeUrl + '">設定／重設密碼</a></p><p>連結限時 24 小時。若未申請，請忽略本信。</p></div>'
      );
    },
  },
  session: {
    expiresIn: 4 * 60 * 60,
    disableSessionRefresh: true,
    cookieCache: { enabled: false },
  },
  rateLimit: { enabled: true, storage: 'database' },
  plugins: [admin()],
});
