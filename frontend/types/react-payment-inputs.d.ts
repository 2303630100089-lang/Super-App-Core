declare module "react-payment-inputs" {
  import * as React from "react";

  export interface CardType {
    displayName: string;
    type: string;
    format: RegExp;
    startPattern: RegExp;
    gaps: number[];
    lengths: number[];
    code: { name: string; size: number };
  }

  export interface Meta {
    cardType?: CardType;
    erroredInputs: Record<string, string | undefined>;
    touchedInputs: Record<string, boolean>;
    isTouched: boolean;
    error?: string;
  }

  export interface PaymentInputsHook {
    meta: Meta;
    getCardNumberProps: (props?: Record<string, unknown>) => Record<string, unknown>;
    getExpiryDateProps: (props?: Record<string, unknown>) => Record<string, unknown>;
    getCVCProps: (props?: Record<string, unknown>) => Record<string, unknown>;
    getCardImageProps: (props: { images: unknown }) => Record<string, unknown>;
    wrapperProps: Record<string, unknown>;
  }

  export function usePaymentInputs(): PaymentInputsHook;
}

declare module "react-payment-inputs/images" {
  export interface CardImages {
    [key: string]: React.ReactElement;
  }
  const images: CardImages;
  export default images;
  export type { CardImages };
}
