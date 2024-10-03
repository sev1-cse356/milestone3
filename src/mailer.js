const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "sev-1.cse356.compas.cs.stonybrook.edu",
  port: 1587,
  secure: false, // true for port 465, false for other ports
  //   auth: {
  //     user: "maddison53@ethereal.email",
  //     pass: "jn7jnAPss4f63QBp6D",
  //   },
  tls: {
    rejectUnauthorized: false,
  },
});

// async..await is not allowed in global scope, must use a wrapper
module.exports.sendVerificationEmail = async function sendVerificationEmail({
  to,
  text,
}) {
  console.log(`Sending email to ${to}`);
  console.log(`Body: ${text}`);
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"TEST" <root@sev-1.cse356.compas.cs.stonybrook.edu>', // sender address
    to, // list of receivers
    subject: "Your Verification Code", // Subject line
    text, // plain text body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
};
