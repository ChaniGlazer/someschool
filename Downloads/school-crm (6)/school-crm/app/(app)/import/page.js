"use client";

import { useState } from "react";
import ImportWizard from "./ImportWizard.js";
import TeacherImportWizard from "./TeacherImportWizard.js";

export default function ImportPage() {
  const [tab, setTab] = useState("students");

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>ייבוא מאקסל</h1>
          <p>ייבוא תלמידים, כיתות ומורים מקבצי אקסל של מערכת בית הספר</p>
        </div>
      </div>

      <div className="toolbar">
        <button
          className={`btn ${tab === "students" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("students")}
        >
          ייבוא תלמידים
        </button>
        <button
          className={`btn ${tab === "teachers" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("teachers")}
        >
          ייבוא מורים
        </button>
      </div>

      {tab === "students" ? <ImportWizard /> : <TeacherImportWizard />}
    </>
  );
}
