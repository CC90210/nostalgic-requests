import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Link,
} from "@react-email/components";
import * as React from "react";

interface VerifyEmailProps {
  confirmationLink: string;
}

export default function VerifyEmail({ confirmationLink = "https://nostalgic.com/verify" }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Nostalgic Requests account</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto my-[40px] max-w-[600px] border border-[#2D2D2D] rounded-lg overflow-hidden shadow-lg p-5">
            <Section className="mt-[32px] mb-[32px] text-center">
              <Heading className="text-[32px] font-bold text-black p-0 my-[30px] mx-0">
                Verify Your Account
              </Heading>
              
              <Text className="text-gray-500 text-[16px] leading-[24px]">
                Thanks for signing up for <span style={{ color: "#7C3AED", fontWeight: "bold" }}>Nostalgic</span>. 
                Please click the button below to verify your email address and get started.
              </Text>

              <Section className="mt-[32px] mb-[32px]">
                <Button
                  className="bg-[#7C3AED] rounded-lg text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                  href={confirmationLink}
                >
                  Confirm Email Address
                </Button>
              </Section>
              
              <Text className="text-gray-500 text-[14px] leading-[24px]">
                Or click this link:
                <br />
                <Link href={confirmationLink} className="text-[#EC4899] no-underline">
                  {confirmationLink}
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

