import { Resend } from "resend";

const resend = (apiKey) =>{
    return new Resend(apiKey);
}

export { resend };
