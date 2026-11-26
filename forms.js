/* Home page: booking form and email sign-up. Settings: RMP_CONFIG.booking and RMP_CONFIG.signup in config.js.
   This site has no server. Unless a sign-up service is set, each form writes an email that the visitor sends,
   so nothing here ever says a message or sign-up has gone through. */
(function () {
  const $ = id => document.getElementById(id);
  const config = window.RMP_CONFIG || {};
  const inbox = (config.booking || {}).email || "Remunerativerecords@gmail.com";
  const mailtoFor = (subject, body) =>
    "mailto:" + inbox + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

  /* Show the finished email with a button to open it and one to copy it. */
  function ready(panel, subject, body) {
    panel.querySelector("textarea").value = "To: " + inbox + "\nSubject: " + subject + "\n\n" + body;
    panel.querySelector("a.btn").href = mailtoFor(subject, body);
    panel.querySelector("[role=status]").textContent = "";
    panel.hidden = false;
    panel.scrollIntoView({ block: "nearest" });
  }
  document.querySelectorAll(".draft").forEach(panel => {
    const box = panel.querySelector("textarea"), note = panel.querySelector("[role=status]");
    panel.querySelector("button").onclick = () => {
      const byHand = () => { box.focus(); box.select(); note.textContent = "Copy the highlighted text."; };
      if (!navigator.clipboard) return byHand();
      navigator.clipboard.writeText(box.value).then(() => note.textContent = "Copied.", byHand);
    };
  });

  /* ---------- booking ---------- */
  const booking = $("bookForm"), who = $("bookArtist");
  artists.forEach(a => who.add(new Option(a.name)));
  const asked = new URLSearchParams(location.search).get("artist"); // set by "Book" on the Spotlight page
  if (artists.some(a => a.name === asked)) who.value = asked;
  booking.oninput = () => $("bookDraft").hidden = true; // an edited form makes the old email out of date
  booking.onsubmit = e => {
    e.preventDefault();
    const value = name => booking.elements[name].value.trim();
    const subject = "Booking request: " + value("type") + (value("artist") ? " - " + value("artist") : "");
    const body = [["Name", value("name")], ["Email", value("email")], ["Booking", value("type")],
      ["Artist", value("artist") || "Not sure yet"], ["Event date", value("date") || "Not set"],
      ["Location", value("place") || "Not set"]].map(row => row.join(": ")).join("\n") + "\n\nDetails:\n" + value("details");
    ready($("bookDraft"), subject, body);
  };

  /* ---------- email sign-up ---------- */
  const signup = $("signupForm"), field = $("signupEmail"), settings = config.signup || {};
  const service = /^https:\/\//.test(settings.action || "") ? settings.action : "";
  if (service) { // post straight to the mailing list service, in a new tab
    signup.action = service; signup.method = "post"; signup.target = "_blank";
    field.name = settings.emailField || "email";
    $("signupButton").textContent = "Sign up";
    $("signupHow").textContent = "You’ll finish signing up in a new tab.";
  }
  signup.oninput = () => $("signupDraft").hidden = true;
  signup.onsubmit = e => {
    if (service) return;
    e.preventDefault();
    ready($("signupDraft"), "Join the RMP email list",
      "Please add this address to the RMP email list: " + field.value.trim());
  };
})();
