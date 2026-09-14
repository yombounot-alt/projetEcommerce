import axios from "axios";
import { env } from "../../src/config/env";
import { EmailProviderNotConfiguredError } from "../../src/integrations/email/email.interface";
import { ResendEmailProvider } from "../../src/integrations/email/providers/resend.provider";

describe("ResendEmailProvider", () => {
  const originalApiKey = env.RESEND_API_KEY;
  const originalFromAddress = env.EMAIL_FROM_ADDRESS;

  afterEach(() => {
    env.RESEND_API_KEY = originalApiKey;
    env.EMAIL_FROM_ADDRESS = originalFromAddress;
    jest.restoreAllMocks();
  });

  it("throws EmailProviderNotConfiguredError when RESEND_API_KEY is missing", () => {
    env.RESEND_API_KEY = "";
    env.EMAIL_FROM_ADDRESS = "hello@lumera.demo";
    expect(() => new ResendEmailProvider()).toThrow(EmailProviderNotConfiguredError);
  });

  it("throws EmailProviderNotConfiguredError when EMAIL_FROM_ADDRESS is missing", () => {
    env.RESEND_API_KEY = "re_test_key";
    env.EMAIL_FROM_ADDRESS = "";
    expect(() => new ResendEmailProvider()).toThrow(EmailProviderNotConfiguredError);
  });

  it("posts to the Resend API with the right payload and maps the response", async () => {
    env.RESEND_API_KEY = "re_test_key";
    env.EMAIL_FROM_ADDRESS = "hello@lumera.demo";

    const postSpy = jest
      .spyOn(axios, "post")
      .mockResolvedValue({ data: { id: "resend-message-id-123" } });

    const provider = new ResendEmailProvider();
    const result = await provider.send({
      to: "client@lumera.demo",
      subject: "Bienvenue",
      html: "<p>Bienvenue</p>",
      text: "Bienvenue",
    });

    expect(postSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        to: "client@lumera.demo",
        subject: "Bienvenue",
        html: "<p>Bienvenue</p>",
        text: "Bienvenue",
      }),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer re_test_key" }),
      }),
    );
    expect(result).toEqual({
      provider: "resend",
      messageId: "resend-message-id-123",
      status: "sent",
    });
  });
});
