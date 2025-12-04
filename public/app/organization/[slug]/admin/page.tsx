  "use client";
  import { useState, useEffect, use } from "react";
  import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
  import { Squiggle } from "@/components/ui/Squiggle";
  import { Building2, Edit3, Save, AlertCircle, CheckCircle } from "lucide-react";
  import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
  import PearButton from "@/components/PearButton";
  import ConfirmActionModal from "@/components/ConfirmActionModal";

  interface AdminPageProps {
    params: Promise<{ slug: string }>;
  }

  interface Admin {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    owner: boolean;
  }

  interface AdminRequest {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
  }

  export default function AdminPage({ params }: AdminPageProps) {
    const { slug } = use(params);
    const organizationId = parseInt(slug);
    const router = useRouter();
    
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [requests, setRequests] = useState<AdminRequest[]>([]);

    const owners = admins.filter((a) => a.owner);
    const regularAdmins = admins.filter((a) => !a.owner);

    const [message, setMessage] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState<
      (() => Promise<void>) | null
    >(null);

    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    // Validate organization admin access *** CHANGE TO OWNER ACCESS LATER***

    const validateOwnerAccess = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(
          `${apiUrl}/organization/validate-owner/${organizationId}`,
          { credentials: "include" }
        );

        if (response.ok) {
          setIsAuthorized(true);
        } else if (response.status === 401) {
          setMessage("Please log in to access this page. Redirecting...");
          setIsAuthorized(false);
          setTimeout(() => router.push("/organization"), 2000);
        } else if (response.status === 403) {
          setMessage(
            "Only organization owners can access this page. Redirecting..."
          );
          setIsAuthorized(false);
          setTimeout(() => router.push("/organization"), 2000);
        } else {
          setMessage("Access validation failed. Redirecting...");
          setIsAuthorized(false);
          setTimeout(() => router.push("/organization"), 2000);
        }
      } catch (err) {
        console.error("Error validating owner access:", err);
        setMessage("Connection error. Redirecting...");
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);
      }
    };

    useEffect(() => {
      validateOwnerAccess();
    }, [organizationId]);

    const fetchAdmins = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

        const res = await fetch(
          `${apiUrl}/organization/org-admins/${organizationId}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          console.error("Failed to load admins");
          return;
        }

        const data = await res.json();
        setAdmins(data.admins);
      } catch (error) {
        console.error("Network error while loading organization profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRequests = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

        const res = await fetch(
          `${apiUrl}/organization/admin-requests/${organizationId}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          console.error("Failed to load admin requests");
          return;
        }

        const data = await res.json();
        setRequests(data.requests);
      } catch (err) {
        console.error("Error loading admin requests:", err);
      }
    };

    useEffect(() => {
      if (isAuthorized) {
        fetchAdmins();
        fetchRequests();
      }
    }, [isAuthorized, organizationId]);

    const openPromoteModal = (admin: Admin) => {
      setConfirmMessage(
        `Promote ${admin.first_name} ${admin.last_name} to Owner?`
      );
      setConfirmAction(() => async () => {
        await handlePromote(admin.id);
      });
      setConfirmOpen(true);
    };

    const handlePromote = async (userId: number) => {
      setActionError(null)
      setActionSuccess(null)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(
          `${apiUrl}/organization/org-admins/promote`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              user_id: userId,
              organization_id: organizationId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setActionError(data.error || "Failed to promote admin");
          return;
        }

        setActionSuccess("Admin promoted successfully!");
        await fetchAdmins();
      } catch (err) {
        setActionError("Error promoting admin.");
      }
    };

    const openRemoveModal = (admin: Admin) => {
      setConfirmMessage(
        `Remove ${admin.first_name} ${admin.last_name} from this organization?`
      );
      setConfirmAction(() => async () => {
        await handleRemove(admin.id);
      });
      setConfirmOpen(true);
    };

    const handleRemove = async (userId: number) => {
      setActionError(null)
      setActionSuccess(null)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(`${apiUrl}/organization/org-admins/remove`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            user_id: userId,
            organization_id: organizationId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setActionError(data.error || "Failed to remove admin");
          return;
        }

        setActionSuccess("Admin removed successfully!");
        await fetchAdmins();
      } catch (err) {
        setActionError("Error removing admin.");
      }
    };

    const handleAccept = async (requestId: number) => {
      setActionError(null)
      setActionSuccess(null)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(
          `${apiUrl}/organization/admin-requests/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              request_id: requestId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setActionError(data.error || "Failed to accept request");
          return;
        }

        setActionSuccess("Request accepted!");
        await fetchAdmins();
        await fetchRequests();
      } catch (err) {
        setActionError("Error accepting request.");
      }
    };

    const handleDeny = async (requestId: number) => {
      setActionError(null)
      setActionSuccess(null)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(
          `${apiUrl}/organization/admin-requests/deny`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              request_id: requestId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setActionError(data.error || "Failed to deny request");
          return;
        }

        setActionSuccess("Request denied!");
        await fetchAdmins();
        await fetchRequests();
      } catch (err) {
        setActionError("Error denying request.");
      }
    };

    const openAcceptModal = (req: AdminRequest) => {
      setConfirmMessage(
        `Accept ${req.first_name} ${req.last_name}'s request to join as an admin?`
      );
      setConfirmAction(() => async () => {
        await handleAccept(req.id);
      });
      setConfirmOpen(true);
    };

    const openDenyModal = (req: AdminRequest) => {
      setConfirmMessage(
        `Deny ${req.first_name} ${req.last_name}'s request to join this organization?`
      );
      setConfirmAction(() => async () => {
        await handleDeny(req.id);
      });
      setConfirmOpen(true);
    };

    return (
      <ProtectedRoute requiredRole="organization">
        <div className="flex flex-col min-h-screen font-sans bg-light-beige">
          <Navbar userType="organization" />

          {/* Authorization Check */}
          {isAuthorized === null ? (
            <main className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pear-2 mx-auto mb-4"></div>
                <p className="text-gray-600">Validating organization access...</p>
              </div>
            </main>
          ) : isAuthorized === false ? (
            <main className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto">
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Access Denied</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <PearButton
                  text="Back to Organizations"
                  onClick={() => router.push("/organization")}
                />
              </div>
            </main>
          ) : (
            <main className="flex-1 p-8 max-w-5xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-12">
                <h1 className="text-[56px] font-extrabold text-[#0a0a0a] relative inline-block tracking-tight">
                  Organization Admins
                  <Squiggle
                    width={530}
                    className="left-1/2 -translate-x-1/2 -bottom-2"
                  />
                </h1>
              </div>

              {actionError && (
                <div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded-md border border-red-300">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="mb-6 bg-green-100 text-green-700 px-4 py-3 rounded-md border border-green-300">
                  {actionSuccess}
                </div>
              )}

              {/* Owners Section */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <div className="bg-pear-1 p-2 rounded-full">
                    <CheckCircle className="w-5 h-5 text-pear-3" />
                  </div>
                  Owners
                </h2>
                <div className="grid gap-4">
                  {owners.length > 0 ? (
                    owners.map((owner) => (
                      <div
                        key={owner.id}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-pear-1 rounded-full flex items-center justify-center text-pear-3 font-bold text-xl">
                            {owner.first_name[0]}
                            {owner.last_name[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {owner.first_name} {owner.last_name}
                            </h3>
                            <p className="text-gray-500">{owner.email}</p>
                          </div>
                        </div>
                        <div className="px-4 py-1 bg-pear-1 text-pear-3 rounded-full text-sm font-medium">
                          Owner
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No owners found.</p>
                  )}
                </div>
              </div>

              {/* Admins Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </div>
                  Admins
                </h2>
                <div className="grid gap-4">
                  {regularAdmins.length > 0 ? (
                    regularAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                            {admin.first_name[0]}
                            {admin.last_name[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {admin.first_name} {admin.last_name}
                            </h3>
                            <p className="text-gray-500">{admin.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openPromoteModal(admin)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Promote to Owner
                          </button>
                          <button
                            onClick={() => openRemoveModal(admin)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No other admins found.</p>
                  )}
                </div>
              </div>

              {/* Requests Section */}
              <div className="mt-16">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  Pending Requests
                </h2>

                <div className="grid gap-4">
                  {requests.length > 0 ? (
                    requests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-700 font-bold text-xl">
                            {req.first_name[0]}
                            {req.last_name[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {req.first_name} {req.last_name}
                            </h3>
                            <p className="text-gray-500">{req.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openAcceptModal(req)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => openDenyModal(req)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No pending requests.</p>
                  )}
                </div>
              </div>
            </main>
          )}
          <Footer />
          <ConfirmActionModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            message={confirmMessage}
            onConfirm={async () => {
              if (confirmAction) {
                await confirmAction();
              }
              setConfirmOpen(false);
            }}
          />
        </div>
      </ProtectedRoute>
    );
  }
