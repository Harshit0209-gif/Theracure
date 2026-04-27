import React, { useState, useCallback } from "react";
import { Phone, Mail, MapPin, User, X, UserCircle, BadgeCheck } from "lucide-react";
import { Patient } from "@/types/patient";
import { debounce } from "lodash";
import ReactSelect from "react-select";
import { Label } from "@/components/ui/label";

interface PatientInfoSectionProps {
  patientInfo: Patient;
  patientFound: boolean;
  onPatientSelect: (patient: Patient) => void;
  onPatientChange: (field: keyof Patient, value: string) => void;
}

export const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  patientInfo,
  patientFound,
  onPatientSelect,
  onPatientChange,
}) => {
  const [patientOptions, setPatientOptions] = useState<{ value: string; label: string; patient: Patient }[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const searchPatients = useCallback(
    debounce(async (input: string) => {
      setIsLoadingPatients(true);
      try {
        const query = input ? `?search=${encodeURIComponent(input)}&limit=20` : "?limit=20";
        const res = await fetch(`/api/patients${query}`);
        const data = await res.json();
        const list: Patient[] = data.patients || data.data || [];
        setPatientOptions(
          list.map((p) => ({
            value: p.id,
            label: `${p.patientName} — ${p.id}${p.phone ? ` · ${p.phone}` : ""}`,
            patient: p,
          }))
        );
      } catch {
        setPatientOptions([]);
      } finally {
        setIsLoadingPatients(false);
      }
    }, 300),
    []
  );

  const handleSelect = (option: any) => {
    if (option) {
      onPatientSelect(option.patient);
    }
  };

  const handleClear = () => {
    onPatientSelect({ patientName: "", id: "" } as any);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <UserCircle className="h-4 w-4 text-indigo-500" />
            Patient Details
          </span>
          <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wide">* Required</span>
        </Label>

        {!patientFound ? (
          <div className="relative group shadow-sm transition-shadow hover:shadow-md rounded-md border border-slate-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-300">
            <ReactSelect
              options={patientOptions}
              onChange={handleSelect}
              onInputChange={(inputValue, actionMeta) => {
                if (actionMeta.action === "input-change") {
                  searchPatients(inputValue || "");
                }
              }}
              onMenuOpen={() => searchPatients("")}
              placeholder="Search patient name or ID..."
              isSearchable
              isLoading={isLoadingPatients}
              loadingMessage={() => "Searching patients..."}
              noOptionsMessage={() => "No patients found"}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  border: "none",
                  boxShadow: "none",
                  backgroundColor: "transparent",
                  minHeight: "40px",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#94a3b8",
                  fontSize: "14px",
                  fontWeight: "500",
                }),
                input: (base) => ({
                  ...base,
                  color: "#1e293b",
                  fontSize: "14px",
                  fontWeight: "600",
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "#1e293b",
                  fontSize: "14px",
                  fontWeight: "600",
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 100,
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "#f5f3ff" : "white",
                  color: state.isSelected ? "#4f46e5" : "#475569",
                  fontWeight: state.isSelected ? "700" : "500",
                  fontSize: "13px",
                  cursor: "pointer",
                  "&:active": { backgroundColor: "#e0e7ff" },
                }),
                loadingIndicator: (base) => ({ ...base, color: "#4f46e5" }),
                loadingMessage: (base) => ({
                  ...base,
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: "600",
                  padding: "8px 12px",
                }),
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

            {/* Header */}
            <div className="relative px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 overflow-hidden">
              {/* decorative circle */}
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white tracking-tight">{patientInfo.patientName}</p>
                      <BadgeCheck className="h-3.5 w-3.5 text-indigo-200" />
                    </div>
                    <p className="text-[11px] text-indigo-200 mt-0.5 font-mono tracking-wide">{patientInfo.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/10 px-2.5 py-1 rounded-full transition-all"
                >
                  <X className="h-2.5 w-2.5" /> Change
                </button>
              </div>
            </div>

            {/* Editable fields */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 bg-white">
              {[
                { field: "patientName" as keyof Patient, label: "Full Name", icon: User, value: patientInfo.patientName },
                { field: "phone" as keyof Patient, label: "Phone", icon: Phone, value: patientInfo.phone },
                { field: "email" as keyof Patient, label: "Email", icon: Mail, value: patientInfo.email },
                { field: "address" as keyof Patient, label: "Address", icon: MapPin, value: patientInfo.address },
              ].map(({ field, label, icon: Icon, value }) => (
                <div key={field} className="group space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon className="h-2.5 w-2.5" />
                    {label}
                  </label>
                  <input
                    value={(value as string) ?? ""}
                    onChange={(e) => onPatientChange(field, e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
              <p className="text-[10px] text-slate-400 font-medium">Fields are editable — changes apply to this invoice only</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
