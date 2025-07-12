import * as React from "react";

export const reactPasswordChangedEmail = ({ username }) => {
  return (
    <html>
      <body
        style={{
          backgroundColor: "#f6f6f6",
          margin: 0,
          padding: "40px 0",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{
            maxWidth: 480,
            margin: "0 auto",
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <tr>
            <td style={{ padding: "40px 40px 30px 40px", textAlign: "center" }}>
              <h1
                style={{
                  color: "#333",
                  fontSize: 28,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: 0.5,
                }}
              >
                Your Password Has Been Changed
              </h1>
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: "0 40px 8px 40px",
                color: "#444",
                fontSize: 17,
              }}
            >
              <p style={{ margin: "0 0 16px" }}>
                Hello <span style={{ fontWeight: 600 }}>{username}</span>,
              </p>
              <p style={{ margin: "0 0 20px" }}>
                This is a confirmation that your password was successfully
                changed. If you made this change, you can safely disregard this
                message.
              </p>
              <p style={{ margin: "0 0 20px" }}>
                If you did <strong>not</strong> change your password, please
                contact support immediately or reset your password using the
                Reset Now link on the login page.
              </p>
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: "32px 40px 10px",
                color: "#aaa",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              — Peckodoro
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};
