/*
 * GreenNext browser RPA demo
 *
 * Paste this file into the Chrome/Edge Developer Tools Console while a
 * GreenNext form is visible. It fills the currently available form and stops
 * before submission. CSV/PDF exports are generated locally in the browser.
 *
 * Supported forms discovered in the project:
 *   - LeadInquiryForm: #lead-name, #lead-email, ...
 *   - LongFormInquiry: #long-name, #long-email, ...
 *   - Quick Inquiry modal: #quick-inquiry-name, ... (supported when opened)
 */
(() => {
  "use strict";

  const CONTEXTUAL_DATA = {
    session: {
      name: "Anika Rao",
      email: "anika.rao@greenfield.example",
      phone: "9000012345",
      organization: "Southern Grid Analytics Pvt. Ltd.",
      region: "Chennai, Tamil Nadu",
      topic: "AI infrastructure planning",
      message:
        "We are planning a 2 MW regional AI compute cluster and would like a technical session on rack density, power headroom, and phased deployment options for South India.",
    },
    partner: {
      name: "Vikram Iyer",
      email: "vikram.iyer@asterion.example",
      phone: "9000067890",
      organization: "Asterion Cooling Systems",
      region: "Bengaluru, Karnataka",
      topic: "Implementation partnership",
      message:
        "Our team develops liquid-cooling systems for high-density racks. We would like to discuss an implementation partnership for GreenNext regional facilities and telemetry integration.",
    },
    technical: {
      name: "Meera Nair",
      email: "meera.nair@vertexworks.example",
      phone: "9000043210",
      organization: "VertexWorks Compute Services",
      region: "Coimbatore, Tamil Nadu",
      topic: "AI workload management",
      message:
        "We need guidance for a 1.5 MW AI workload deployment, including workload scheduling, thermal telemetry, automated alert thresholds, and capacity planning across two regional sites.",
    },
    career: {
      name: "Rohan Menon",
      email: "rohan.menon@researchmail.example",
      phone: "9000098765",
      organization: "Northstar Compute Research",
      region: "Hyderabad, Telangana",
      currentRole: "Graduate Researcher in Energy Systems",
      experienceLevel: "Researcher",
      topic: "Energy and cooling",
      linkedinUrl: "https://linkedin.com/in/rohan-menon-demo",
      portfolioUrl: "https://github.com/rohan-menon-demo",
      message:
        "I am interested in contributing to data center energy modeling and cooling optimization projects, with a focus on measurable efficiency improvements for AI infrastructure.",
    },
    long: {
      name: "Sanjay Kulkarni",
      email: "sanjay.kulkarni@orbitedge.example",
      phone: "9000024680",
      organization: "OrbitEdge Compute Services",
      category: "AI & High-Density Compute",
      region: "Coimbatore (CJB)",
      message:
        "We are evaluating a 2 MW deployment with an initial 40-rack AI cluster and a path to 80 racks. Please advise on power distribution, liquid-to-chip cooling, telemetry and automated incident response, regional redundancy, and a 12-month phased commissioning timeline.",
    },
    quick: {
      name: "Priya Shah",
      email: "priya.shah@meridian.example",
      phone: "9000035791",
      interest: "Infrastructure Monitoring",
      message:
        "We are reviewing monitoring options for a regional data center and would like an introductory discussion about telemetry, alerts, and operational reporting.",
    },
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const visible = (element) =>
    Boolean(
      element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length),
    );
  const inViewport = (element) => {
    if (!visible(element)) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  };
  const clean = (value) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

  function describeForm(form) {
    const controls = [...form.querySelectorAll("input, textarea, select")];
    const ids = controls.map((control) => control.id).filter(Boolean);
    const labels = controls.map((control) => fieldLabel(control)).filter(Boolean);
    const text = clean(
      `${form.querySelector("h1, h2, h3")?.textContent || ""} ${form.textContent || ""}`,
    );
    const dialog = form.closest('[role="dialog"], [aria-modal="true"]');
    const hasQuickFields = ids.some((id) => id.startsWith("quick-inquiry-"));
    const hasLongFields = ids.some((id) => id.startsWith("long-"));
    const hasLeadFields =
      ids.some((id) => id.startsWith("lead-")) ||
      labels.some((label) => /session|partnership|inquiry topic|area of interest/i.test(label));
    const visibleControls = controls.filter((control) => inViewport(control));
    let type = null;
    let score = 0;
    if (
      hasQuickFields ||
      /quick inquiry|send infrastructure inquiry/i.test(text) ||
      dialog?.getAttribute("aria-label") === "Quick Inquiry Form"
    ) {
      type = "quick";
      score += hasQuickFields ? 100 : 30;
    } else if (
      hasLongFields ||
      /submit technical inquiry|infrastructure requirements or message/i.test(text)
    ) {
      type = "long";
      score += hasLongFields ? 100 : 30;
    } else if (
      hasLeadFields ||
      /book a technical session|partner with greennext|join greennext/i.test(text)
    ) {
      type = "lead";
      score += hasLeadFields ? 100 : 30;
    }
    if (!type || visibleControls.length === 0) return null;
    if (dialog || form === document.activeElement?.closest?.("form")) score += 1000;
    return {
      form,
      type,
      score,
      visibleControls,
      heading: clean(form.querySelector("h1, h2, h3")?.textContent),
      dialog: Boolean(dialog),
    };
  }

  function detectForm() {
    const candidates = [...document.querySelectorAll("form")].map(describeForm).filter(Boolean);
    console.info(
      `[GreenNext RPA] Visible form candidates: ${candidates.map((candidate) => `${candidate.type}${candidate.heading ? ` (${candidate.heading})` : ""}${candidate.dialog ? " [modal]" : ""}`).join("; ") || "none"}`,
    );
    const detected = candidates.sort(
      (left, right) =>
        right.score - left.score || right.visibleControls.length - left.visibleControls.length,
    )[0];
    if (!detected)
      throw new Error(
        "No visible GreenNext inquiry form was found. Open the form or modal and run the script again.",
      );
    if (detected.type === "lead") {
      const title = detected.heading;
      const leadType =
        title === "Partner With GreenNext"
          ? "partner"
          : title === "Infrastructure Requirements Inquiry"
            ? "technical"
            : title === "Join GreenNext"
              ? "career"
              : "session";
      detected.context = leadType;
      detected.purpose = {
        session: "Book a Technical Session",
        partner: "Partner With GreenNext",
        technical: "Infrastructure Requirements Inquiry",
        career: "Join GreenNext",
      }[leadType];
    } else {
      detected.context = detected.type;
      detected.purpose =
        detected.type === "long"
          ? "Infrastructure Requirements Inquiry"
          : "Quick Infrastructure Inquiry";
    }
    console.info(`[GreenNext RPA] Detected form type: ${detected.purpose}`);
    console.info("[GreenNext RPA] Detected form element:", detected.form);
    return detected;
  }

  function fieldLabel(control) {
    if (control.labels?.[0]) return clean(control.labels[0].textContent);
    if (control.getAttribute("aria-label")) return clean(control.getAttribute("aria-label"));
    const wrapper = control.closest("div");
    return clean(
      wrapper?.querySelector("label")?.textContent || control.name || control.id || "Field",
    );
  }

  function setReactValue(control, value) {
    control.focus();
    const prototype =
      control instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : control instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(control, value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
    control.blur();
  }

  function firstSelectableValue(control, preferred) {
    const values = [...control.options]
      .map((option) => option.value || option.textContent.trim())
      .filter(Boolean);
    const exact =
      values.find((value) => value === preferred) ||
      values.find((value) => value.toLowerCase() === String(preferred || "").toLowerCase());
    return exact || values.find((value) => !/select|choose/i.test(value)) || values[0] || "";
  }

  function findBySemanticKey(form, key) {
    const controls = [...form.querySelectorAll("input, textarea, select")].filter(
      (control) => control.type !== "file",
    );
    const normalizedSemanticKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const labelAliases = {
      topic:
        /session\s*\/\s*consultation\s*topic|partnership\s*interest|inquiry\s*topic|area\s*of\s*interest/i,
      experienceLevel: /experience\s*level/i,
    };
    return controls.find((control) => {
      const haystack = [
        control.id,
        control.name,
        control.autocomplete,
        control.getAttribute("aria-label"),
        fieldLabel(control),
      ]
        .join(" ")
        .toLowerCase();
      const normalizedHaystack = haystack.replace(/[^a-z0-9]/g, "");
      return (
        normalizedHaystack.includes(normalizedSemanticKey) || labelAliases[key]?.test(haystack)
      );
    });
  }

  function currentRenderedValue(control) {
    if (control instanceof HTMLSelectElement) {
      const option = control.selectedOptions?.[0];
      return option?.value || option?.textContent?.trim() || "";
    }
    if (control.type === "checkbox" || control.type === "radio") {
      return control.checked ? "checked" : "";
    }
    return String(control.value || "").trim();
  }

  function fieldMap(type) {
    if (type === "long")
      return {
        name: "long-name",
        email: "long-email",
        phone: "long-phone",
        organization: "long-organization",
        category: "long-category",
        region: "long-region",
        message: "long-message",
      };
    if (type === "quick")
      return {
        name: "quick-inquiry-name",
        email: "quick-inquiry-email",
        phone: "quick-inquiry-phone",
        interest: "quick-inquiry-interest",
        message: "quick-inquiry-message",
      };
    return {
      name: "lead-name",
      email: "lead-email",
      phone: "lead-phone",
      organization: "lead-organization",
      region: "lead-region",
      topic: null,
      message: "lead-message",
      currentRole: "lead-current-role-student-status-",
      experienceLevel: null,
      linkedinUrl: "lead-linkedin-url",
      portfolioUrl: "lead-portfolio-github-url",
    };
  }

  function controlFor(form, key, id) {
    return (id && form.querySelector(`#${CSS.escape(id)}`)) || findBySemanticKey(form, key);
  }

  async function fillForm(detected) {
    const data = CONTEXTUAL_DATA[detected.context];
    const ids = fieldMap(detected.type);
    const filled = [];
    for (const [key, value] of Object.entries(data)) {
      const control = controlFor(detected.form, key, ids[key]);
      if (!control || !visible(control)) continue;
      if (control.type === "file") continue;
      if (control.tagName === "SELECT")
        setReactValue(control, firstSelectableValue(control, value));
      else if (control.type === "checkbox" || control.type === "radio") {
        const desired = Boolean(value);
        if (control.checked !== desired) control.click();
        control.dispatchEvent(new Event("change", { bubbles: true }));
      } else setReactValue(control, value);
      filled.push({ control, key });
      await sleep(120);
    }

    const values = [...detected.form.querySelectorAll("input, textarea, select")]
      .filter(
        (control) =>
          control.type !== "file" && control.type !== "submit" && control.type !== "button",
      )
      .map((control) => ({
        control,
        label: fieldLabel(control),
        value:
          control.type === "checkbox" || control.type === "radio"
            ? control.checked
              ? "Checked"
              : "Unchecked"
            : control.value,
      }));
    await sleep(180);
    const expectedKeys =
      detected.type === "long"
        ? ["name", "email", "phone", "organization", "category", "region", "message"]
        : detected.type === "quick"
          ? ["name", "email", "phone", "interest", "message"]
          : [
              "name",
              "email",
              "phone",
              "organization",
              "region",
              "topic",
              "message",
              ...(detected.context === "career"
                ? ["currentRole", "experienceLevel", "linkedinUrl", "portfolioUrl"]
                : []),
            ];
    const missing = expectedKeys
      .map((key) => ({ key, control: controlFor(detected.form, key, ids[key]) }))
      .filter(({ control }) => !control || !currentRenderedValue(control));
    if (missing.length)
      throw new Error(`Verification failed for: ${missing.map(({ key }) => key).join(", ")}`);
    return {
      values: Array.from(detected.form.querySelectorAll("input, textarea, select"))
        .filter(
          (control) =>
            control.type !== "file" && control.type !== "submit" && control.type !== "button",
        )
        .map((control) => ({
          control,
          label: fieldLabel(control),
          value:
            control.type === "checkbox" || control.type === "radio"
              ? control.checked
                ? "Checked"
                : "Unchecked"
              : control.value,
        })),
      filledCount: filled.length,
    };
  }

  function formSnapshot(detected, values) {
    return {
      formType: detected.purpose,
      generatedAt: new Date(),
      fields: values.map(({ label, value }) => ({ label: label || "Field", value: value || "" })),
    };
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvExport(snapshot) {
    const rows = [["Field", "Value"], ...snapshot.fields.map(({ label, value }) => [label, value])];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    download(
      new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
      `greennext-${snapshot.formType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-demo.csv`,
    );
  }

  function pdfEscape(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/[()]/g, "\\$&")
      .replace(/[^\x20-\x7E]/g, "?");
  }

  function pdfExport(snapshot) {
    const lines = [
      "GreenNext",
      "AI Data Center Digital Presence",
      "",
      `Form type: ${snapshot.formType}`,
      `Generated: ${snapshot.generatedAt.toLocaleString()}`,
      "",
      ...snapshot.fields.flatMap(({ label, value }) => [`${label}:`, value || "(empty)", ""]),
    ];
    const pages = [];
    for (let index = 0; index < lines.length; index += 38)
      pages.push(lines.slice(index, index + 38));
    const objects = [
      null,
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [PAGES] /Count COUNT >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ];
    const pageRefs = [];
    pages.forEach((pageLines) => {
      const content = [
        "BT",
        "/F1 11 Tf",
        "50 760 Td",
        "15 TL",
        ...pageLines.map((line, index) => `${index ? "T* " : ""}(${pdfEscape(line)}) Tj`),
        "ET",
      ].join("\n");
      const contentRef =
        objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`) - 1;
      const pageRef =
        objects.push(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentRef} 0 R >>`,
        ) - 1;
      pageRefs.push(`${pageRef} 0 R`);
    });
    objects[2] = objects[2]
      .replace("PAGES", pageRefs.join(" "))
      .replace("COUNT", String(pageRefs.length));
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.slice(1).forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let index = 1; index < objects.length; index++)
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    download(
      new Blob([pdf], { type: "application/pdf" }),
      `greennext-${snapshot.formType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-demo.pdf`,
    );
  }

  function showChoice(snapshot) {
    document.getElementById("greennext-rpa-choice")?.remove();
    const panel = document.createElement("div");
    panel.id = "greennext-rpa-choice";
    panel.style.cssText =
      "position:fixed;z-index:2147483647;right:20px;bottom:20px;width:340px;padding:18px;background:#0B0F17;color:#fff;border:1px solid #10B981;border-radius:12px;box-shadow:0 12px 40px #0009;font:14px system-ui,sans-serif";
    panel.innerHTML = `<strong>Form filled successfully. What would you like to do?</strong><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button data-rpa="csv" style="padding:8px 10px;cursor:pointer">Download as CSV</button><button data-rpa="pdf" style="padding:8px 10px;cursor:pointer">Download as PDF</button><button data-rpa="continue" style="padding:8px 10px;cursor:pointer">Continue editing</button></div>`;
    panel.addEventListener("click", (event) => {
      const action = event.target.closest("button")?.dataset.rpa;
      if (action === "csv") csvExport(snapshot);
      if (action === "pdf") pdfExport(snapshot);
      if (action === "continue" || action === "csv" || action === "pdf") panel.remove();
    });
    document.body.appendChild(panel);
  }

  (async () => {
    try {
      const detected = detectForm();
      console.info(
        `[GreenNext RPA] Detected ${detected.type} form. Submit controls remain untouched.`,
      );
      const result = await fillForm(detected);
      const snapshot = formSnapshot(detected, result.values);
      console.info(
        `[GreenNext RPA] Verified ${result.filledCount} contextual fields. No submit event, form.submit(), API call, or submit-button click was used.`,
      );
      showChoice(snapshot);
    } catch (error) {
      console.error("[GreenNext RPA] Stopped safely:", error);
    }
  })();
})();
