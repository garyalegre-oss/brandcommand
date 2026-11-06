import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      apiKey: customApiKey,
      brandName,
      brandPrimaryColor,
      brandTextColor,
      brandLogoEmoji,
      brandLogoUrl,
      brandTagline,
      subject,
      headline,
      greeting,
      intro,
      keyPoints,
      ctaButton,
      signOff,
      psNote,
      fromEmail,
      emailHeaderBg,
      emailHeaderTextColor,
      emailCtaBg,
      emailCtaTextColor,
      emailCardBg,
      emailBodyBg
    } = body;

    const apiKey = customApiKey || process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_API_KEY',
          message: 'No Resend API key found. Enter your free API key from resend.com to send test emails directly to your inbox.'
        },
        { status: 400 }
      );
    }

    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'INVALID_RECIPIENT', message: 'A valid recipient email address is required.' },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    // Resend's default free test domain is onboarding@resend.dev until custom domain is verified
    const sender = fromEmail || `${brandName} <onboarding@resend.dev>`;

    const headerBgColor = emailHeaderBg || brandPrimaryColor || '#059669';
    const headerTextColorFinal = emailHeaderTextColor || brandTextColor || '#ffffff';
    const ctaBgColor = emailCtaBg || headerBgColor;
    const ctaTextColorFinal = emailCtaTextColor || headerTextColorFinal;
    const cardBgColor = emailCardBg || '#ffffff';
    const bodyBgColor = emailBodyBg || '#f8fafc';

    // Format clean HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${bodyBgColor}; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${cardBgColor}; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: ${headerBgColor}; color: ${headerTextColorFinal}; padding: 28px; text-align: center;">
      ${brandLogoUrl
        ? `<div style="margin-bottom: 12px;"><img src="${brandLogoUrl}" alt="${brandName}" style="max-height: 52px; max-width: 200px; object-fit: contain; vertical-align: middle; background-color: rgba(255,255,255,0.95); padding: 6px 12px; border-radius: 12px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" /></div>`
        : `<div style="font-size: 36px; margin-bottom: 8px;">${brandLogoEmoji || '✨'}</div>`
      }
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${brandName}</h1>
      ${brandTagline ? `<p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">${brandTagline}</p>` : ''}
    </div>
    
    <div style="padding: 36px 32px;">
      <h2 style="font-size: 22px; font-weight: 800; margin-top: 0; color: #0f172a; line-height: 1.3;">${headline}</h2>
      <p style="font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 12px;">${greeting}</p>
      <p style="font-size: 15px; line-height: 1.6; color: #475569; white-space: pre-line;">${intro}</p>
      
      ${
        keyPoints && keyPoints.length > 0
          ? `
      <div style="margin: 28px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 18px 0;">
        ${keyPoints
          .map(
            (kp: { title: string; description: string }) => `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #0f172a;">${kp.title}</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #475569;">${kp.description}</p>
        </div>`
          )
          .join('')}
      </div>`
          : ''
      }

      ${
        ctaButton
          ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${ctaButton.url}" style="background-color: ${ctaBgColor}; color: ${ctaTextColorFinal}; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block;">
          ${ctaButton.text}
        </a>
      </div>`
          : ''
      }

      <p style="font-size: 14px; line-height: 1.6; color: #64748b; white-space: pre-line; margin-top: 28px;">
        ${signOff}
      </p>

      ${
        psNote
          ? `
      <div style="font-size: 13px; line-height: 1.5; color: #475569; background-color: #f8fafc; border-left: 3px solid ${ctaBgColor}; padding: 14px; border-radius: 6px; margin-top: 24px;">
        <strong>P.S.</strong> ${psNote.replace(/^P\.S\.\s*/i, '')}
      </div>`
          : ''
      }
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 6px;">Sent via BrandCommand OS for ${brandName}.</p>
      <p style="margin: 0;">This is a real test delivery to your verified email address.</p>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: sender,
      to: [to],
      subject: subject,
      html: htmlContent
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.name, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email successfully delivered to ${to}!`,
      id: data?.id
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
