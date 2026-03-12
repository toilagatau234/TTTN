const nodemailer = require('nodemailer');

/**
 * Tạo transporter SMTP (Gmail)
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * HTML Email Template OTP
 */
const buildOtpEmailHtml = (otpCode, expiresMinutes = 5) => {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Mã xác nhận đăng ký</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:20px;overflow:hidden;
                 box-shadow:0 4px 30px rgba(0,0,0,0.08);border:1px solid #d1fae5;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#34d399 0%,#10b981 100%);
                        padding:36px 40px;text-align:center;">
              <div style="font-size:42px;margin-bottom:8px;">🌸</div>
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;
                          letter-spacing:0.5px;">Hoa Tươi Online</h1>
              <p style="margin:6px 0 0;color:#d1fae5;font-size:13px;">
                Xác nhận địa chỉ email của bạn
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                Xin chào! 👋
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                Chúng tôi đã nhận được yêu cầu <strong>đăng ký tài khoản</strong> từ địa chỉ email này.
                Hãy nhập mã xác nhận bên dưới để hoàn tất đăng ký:
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 100%);
                          border:2px dashed #6ee7b7;border-radius:16px;
                          padding:28px 20px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 12px;font-size:13px;color:#6b7280;letter-spacing:1px;
                            text-transform:uppercase;font-weight:600;">Mã xác nhận</p>
                <div style="font-size:48px;font-weight:800;letter-spacing:14px;
                             color:#059669;font-family:'Courier New',Courier,monospace;
                             text-shadow:0 2px 4px rgba(5,150,105,0.15);">
                  ${otpCode}
                </div>
                <p style="margin:14px 0 0;font-size:13px;color:#9ca3af;">
                  ⏱️ Mã có hiệu lực trong <strong style="color:#ef4444;">${expiresMinutes} phút</strong>
                </p>
              </div>

              <!-- Warning -->
              <div style="background:#fff7ed;border-left:4px solid #f97316;
                          border-radius:8px;padding:14px 16px;margin-bottom:28px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  ⚠️ <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã này với bất kỳ ai.
                  Đội ngũ của chúng tôi <strong>sẽ không bao giờ</strong> hỏi mã xác nhận qua điện thoại hay chat.
                </p>
              </div>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này. 
                Tài khoản của bạn vẫn an toàn.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                        padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.8;">
                Email này được gửi tự động từ hệ thống <strong>Hoa Tươi Online</strong>.<br/>
                Vui lòng không trả lời email này.
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#d1d5db;">
                🌸 Hoa Tươi Online – Mang yêu thương đến mọi nhà
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Gửi email OTP
 * @param {string} toEmail - Địa chỉ người nhận
 * @param {string} otpCode - Mã OTP 6 số
 * @param {number} expiresMinutes - Số phút hết hạn (mặc định 5)
 */
const sendOtpEmail = async (toEmail, otpCode, expiresMinutes = 5) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Hoa Tươi Online 🌸" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `[Hoa Tươi Online] Mã xác nhận đăng ký: ${otpCode}`,
        html: buildOtpEmailHtml(otpCode, expiresMinutes),
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
};

module.exports = { sendOtpEmail };
