// VIP accounts that get the Spotify player
export const adminEmails = [
  "augustineosezua1@gmail.com",
  "tristanmerkley@gmail.com",
  "patrickosezua1@gmail.com",
];

export const isAdminEmail = (email) => !!email && adminEmails.includes(email);
