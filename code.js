const fs = require("fs");
const puppeteer = require("puppeteer");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderContact(contact) {
  const parts = [
    contact.email,
    contact.github,
    contact.linkedin,
    contact.phone,
    contact.location
  ].filter(Boolean);

  return parts.map(escapeHtml).join(" | ");
}

function renderExperience(experience = []) {
  return experience
    .map(
      (job) => `
        <div class="item">
          <div class="row">
            <div>
              <strong>${escapeHtml(job.role)}</strong>, ${escapeHtml(job.company)} - ${escapeHtml(job.location)}
            </div>
            <div class="date">${escapeHtml(job.start_date)} - ${escapeHtml(job.end_date)}</div>
          </div>
          <ul>
            ${(job.bullets || [])
              .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
              .join("")}
          </ul>
        </div>
      `
    )
    .join("");
}

function renderProjects(projects = []) {
  if (!projects.length) return "";

  return `
    <section>
      <h2>PROJECTS</h2>
      ${projects
        .map(
          (project) => `
            <div class="item">
              <div class="row">
                <div>
                  <strong>${escapeHtml(project.name)}</strong>
                  ${project.link ? ` ${escapeHtml(project.link)}` : ""}
                </div>
              </div>
              <ul>
                ${(project.bullets || [])
                  .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
                  .join("")}
              </ul>
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

function renderSkills(skills = []) {
  return skills
    .map(
      (group) => `
        <div class="skill-line">
          <strong>${escapeHtml(group.label)}:</strong>
          ${(group.items || []).map(escapeHtml).join(", ")}
        </div>
      `
    )
    .join("");
}

function renderEducation(education = []) {
  return education
    .map(
      (edu) => `
        <div class="edu-line">
          <span>${escapeHtml(edu.school)} - ${escapeHtml(edu.degree)}</span>
          <span>${escapeHtml(edu.graduation_date || "")}</span>
        </div>
      `
    )
    .join("");
}

function renderResumeHtml(agentOutput) {
  const resume = agentOutput.out || agentOutput;

  const font = resume.document?.font || {};
  const margins = resume.document?.margins || {};

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: Letter;
      margin: ${margins.top || 0.5}in ${margins.right || 0.5}in ${margins.bottom || 0.5}in ${margins.left || 0.5}in;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: ${font.family || "Arial"}, sans-serif;
      font-size: ${font.body_size || 10}px;
      line-height: 1.22;
      color: #111;
      margin: 0;
      padding: 0;
    }

    .name {
      font-size: ${font.name_size || 18}px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 2px;
    }

    .contact {
      text-align: center;
      font-size: 9.5px;
      margin-bottom: 8px;
    }

    h2 {
      font-size: ${font.section_size || 11}px;
      margin: 8px 0 4px;
      padding-bottom: 2px;
      border-bottom: 1px solid #111;
      letter-spacing: 0.4px;
    }

    .item {
      margin-bottom: 5px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
    }

    .date {
      white-space: nowrap;
      text-align: right;
    }

    ul {
      margin: 2px 0 0 14px;
      padding: 0;
    }

    li {
      margin-bottom: 2px;
    }

    .skill-line {
      margin-bottom: 2px;
    }

    .edu-line {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="name">${escapeHtml(resume.candidate.name)}</div>
  <div class="contact">${renderContact(resume.candidate.contact)}</div>

  <section>
    <h2>EXPERIENCE</h2>
    ${renderExperience(resume.experience)}
  </section>

  ${renderProjects(resume.projects)}

  <section>
    <h2>SKILLS</h2>
    ${renderSkills(resume.skills)}
  </section>

  <section>
    <h2>EDUCATION</h2>
    ${renderEducation(resume.education)}
  </section>
</body>
</html>
`;
}

async function generateResumePdf(agentOutput, outputPath = "resume.pdf") {
  const html = renderResumeHtml(agentOutput);

  const browser = await puppeteer.launch({
    headless: "new"
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0"
  });

  await page.pdf({
    path: outputPath,
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true
  });

  await browser.close();

  return outputPath;
}

async function main() {
  const inputPath = process.argv[2] || "input.json";
  const outputPath = process.argv[3] || "resume.pdf";

  const raw = fs.readFileSync(inputPath, "utf8");
  const agentOutput = JSON.parse(raw);

  await generateResumePdf(agentOutput, outputPath);

  console.log(`PDF created: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});