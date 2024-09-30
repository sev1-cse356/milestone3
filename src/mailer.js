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
async function main() {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"TEST" <root@sev-1.cse356.compas.cs.stonybrook.edu>', // sender address
    to: "jiechenmc2@gmail.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

main().catch(console.error);
