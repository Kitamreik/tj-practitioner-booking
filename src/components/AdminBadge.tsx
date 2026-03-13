import { Shield } from "lucide-react";

const AdminBadge = () => {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      <Shield className="h-3.5 w-3.5" />
      Admin
    </span>
  );
};

export default AdminBadge;
