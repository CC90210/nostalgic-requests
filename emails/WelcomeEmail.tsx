import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  djName: string;
}

export default function WelcomeEmail({ djName = "DJ" }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Nostalgic Requests!</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                primary: "#7C3AED",
                secondary: "#EC4899",
                background: "#0A0A0B",
                surface: "#1A1A1B",
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans">
          <Container className="mx-auto my-[40px] max-w-[600px] border border-[#2D2D2D] rounded-lg overflow-hidden shadow-lg p-5">
            <Section className="mt-[32px] mb-[32px] text-center">
              <Heading className="text-[32px] font-bold text-black p-0 my-[30px] mx-0">
                Welcome to <span style={{ color: "#7C3AED" }}>Nostalgic</span>
              </Heading>
              
              <Text className="text-black text-[16px] leading-[24px]">
                 Hey <strong>{djName}</strong>! ??
              </Text>
              
              <Text className="text-gray-500 text-[16px] leading-[24px]">
                We''re thrilled to have you onboard. Nostalgic Requests is designed to help you monetize your sets 
                and engage your crowd like never before.
              </Text>

              <Section className="mt-[32px] mb-[32px]">
                <Button
                  className="bg-[#7C3AED] rounded-lg text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                  href="https://nostalgicrequests.com/dashboard/new"
                >
                  Create Your First Event
                </Button>
              </Section>
              
              <Text className="text-gray-500 text-[14px] leading-[24px]">
                If the button above doesn''t work, copy and paste this link into your browser:
                <br />
                <a href="https://nostalgicrequests.com/dashboard" className="text-[#EC4899] no-underline">
                  https://nostalgicrequests.com/dashboard
                </a>
              </Text>
            </Section>
            
            <Section className="border-t border-[#EAEAEA] mt-[32px] pt-[32px]">
              <Text className="text-[#666666] text-[12px] text-center">
                Powered by Nostalgic Events
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}



