// TODO: Re-enable when vue-email supports Nuxt 4
// import { useCompiler } from "#vue-email";
import { mailTemplates } from "mail/util/templates";
import { send } from "mail/provider";

export const sendEmail = async <TemplateId extends keyof typeof mailTemplates>({
  to,
  templateId,
  context: _context,
}: {
  to: string;
  templateId: TemplateId;
  context?: any;
}) => {
  console.warn('Email sending is temporarily disabled - vue-email not compatible with Nuxt 4');
  
  // TODO: Re-enable when vue-email supports Nuxt 4
  // const templateData = mailTemplates[templateId];
  // const template = await useCompiler(templateData.name, {
  //   props: context,
  // });

  try {
    // Temporary: Send plain text email without template
    const templateData = mailTemplates[templateId];
    await send({
      to,
      subject: templateData.subject,
      text: `Email content for ${templateId}. Template rendering temporarily disabled.`,
      html: `<p>Email content for ${templateId}. Template rendering temporarily disabled.</p>`,
    });

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
