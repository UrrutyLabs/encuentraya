"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { Category, Role } from "@repo/domain";

type TestResult = {
  name: string;
  result?: unknown;
  error?: unknown;
  timestamp: string;
};

export default function TestPage() {
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState<Role | "">("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const initialized = useRef(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (!initialized.current && typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("test-user-id");
      const storedUserRole = localStorage.getItem("test-user-role");
      setCurrentUserId(storedUserId);
      setCurrentUserRole(storedUserRole);
      if (storedUserId) setUserId(storedUserId);
      if (storedUserRole) setUserRole(storedUserRole as Role);
      initialized.current = true;
    }
  }, []);

  // Health check
  const healthPing = trpc.health.ping.useQuery(undefined, {
    enabled: false,
  });

  // Pro queries
  const proGetAll = trpc.pro.getAll.useQuery(undefined, { enabled: false });
  const [proId, setProId] = useState("");
  const proGetById = trpc.pro.getById.useQuery(
    { id: proId },
    { enabled: false }
  );

  // Booking queries
  const [bookingId, setBookingId] = useState("");
  const bookingGetById = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: false }
  );
  const [clientId, setClientId] = useState("");
  const bookingGetByClient = trpc.booking.getByClient.useQuery(
    { clientId },
    { enabled: false }
  );
  const [proIdForBookings, setProIdForBookings] = useState("");
  const bookingGetByPro = trpc.booking.getByPro.useQuery(
    { proId: proIdForBookings },
    { enabled: false }
  );

  // Mutations
  const proOnboard = trpc.pro.onboard.useMutation();
  const proSetAvailability = trpc.pro.setAvailability.useMutation();
  const bookingCreate = trpc.booking.create.useMutation();
  const bookingAccept = trpc.booking.accept.useMutation();
  const bookingReject = trpc.booking.reject.useMutation();
  const bookingCancel = trpc.booking.cancel.useMutation();
  const bookingComplete = trpc.booking.complete.useMutation();

  const saveTestUser = () => {
    if (typeof window !== "undefined") {
      if (userId) {
        localStorage.setItem("test-user-id", userId);
      } else {
        localStorage.removeItem("test-user-id");
      }
      if (userRole) {
        localStorage.setItem("test-user-role", userRole);
      } else {
        localStorage.removeItem("test-user-role");
      }
      window.location.reload();
    }
  };

  const runTest = async (
    name: string,
    testFn: () => Promise<unknown> | unknown
  ) => {
    setError(null);
    setTestResult(null);
    try {
      const result = await testFn();
      setTestResult({ name, result, timestamp: new Date().toISOString() });
    } catch (err) {
      const errorMessage =
        (err as { message?: string })?.message ||
        (err as { data?: { message?: string } })?.data?.message ||
        "Unknown error occurred";
      setError(errorMessage);
      setTestResult({ name, error: err, timestamp: new Date().toISOString() });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">ArreglaTodo API Test Interface</h1>

        {/* Test User Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Test User Configuration</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                User ID (x-user-id header)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., user-123"
                className="w-full px-3 py-2 border rounded-md text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                User Role (x-user-role header)
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as Role | "")}
                className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
              >
                <option value="" className="text-gray-900">None</option>
                <option value={Role.CLIENT} className="text-gray-900">Client</option>
                <option value={Role.PRO} className="text-gray-900">Pro</option>
                <option value={Role.ADMIN} className="text-gray-900">Admin</option>
              </select>
            </div>
          </div>
          <button
            onClick={saveTestUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save & Reload
          </button>
          <p className="text-sm text-gray-900 mt-2">
            Current: User ID = {currentUserId || "none"}, Role = {currentUserRole || "none"}
          </p>
        </div>

        {/* Health Check */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Health Check</h2>
          <button
            onClick={() => runTest("health.ping", () => healthPing.refetch())}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Test health.ping
          </button>
        </div>

        {/* Pro Endpoints */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Pro Endpoints</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={() => runTest("pro.getAll", () => proGetAll.refetch())}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
              >
                Get All Pros
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={proId}
                onChange={(e) => setProId(e.target.value)}
                placeholder="Pro ID"
                className="flex-1 px-3 py-2 border rounded-md text-gray-900"
              />
              <button
                onClick={() =>
                  runTest("pro.getById", () => proGetById.refetch())
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Get Pro By ID
              </button>
            </div>
            <div>
              <button
                onClick={() =>
                  runTest("pro.onboard", () =>
                    proOnboard.mutateAsync({
                      name: "Test Pro",
                      email: "test@example.com",
                      hourlyRate: 50,
                      categories: [Category.PLUMBING],
                    })
                  )
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Onboard New Pro
              </button>
            </div>
            <div>
              <button
                onClick={() =>
                  runTest("pro.setAvailability", () =>
                    proSetAvailability.mutateAsync({
                      isAvailable: true,
                    })
                  )
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                disabled={currentUserRole !== Role.PRO}
              >
                Set Availability (requires PRO role)
              </button>
            </div>
          </div>
        </div>

        {/* Booking Endpoints */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Booking Endpoints</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={() =>
                  runTest("booking.create", () =>
                    bookingCreate.mutateAsync({
                      proId: "pro-123",
                      category: Category.PLUMBING,
                      description: "Fix leaky faucet",
                      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
                      estimatedHours: 2,
                    })
                  )
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                disabled={!currentUserId}
              >
                Create Booking (requires user ID)
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Booking ID"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={() =>
                  runTest("booking.getById", () => bookingGetById.refetch())
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Get Booking By ID
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Client ID"
                className="flex-1 px-3 py-2 border rounded-md text-gray-900"
              />
              <button
                onClick={() =>
                  runTest("booking.getByClient", () =>
                    bookingGetByClient.refetch()
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Get Client Bookings
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={proIdForBookings}
                onChange={(e) => setProIdForBookings(e.target.value)}
                placeholder="Pro ID"
                className="flex-1 px-3 py-2 border rounded-md text-gray-900"
              />
              <button
                onClick={() =>
                  runTest("booking.getByPro", () => bookingGetByPro.refetch())
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Get Pro Bookings
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Booking ID"
                className="flex-1 px-3 py-2 border rounded-md text-gray-900"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    runTest("booking.accept", () =>
                      bookingAccept.mutateAsync({ bookingId })
                    )
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={currentUserRole !== Role.PRO}
                >
                  Accept (PRO)
                </button>
                <button
                  onClick={() =>
                    runTest("booking.reject", () =>
                      bookingReject.mutateAsync({ bookingId })
                    )
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={currentUserRole !== Role.PRO}
                >
                  Reject (PRO)
                </button>
                <button
                  onClick={() =>
                    runTest("booking.cancel", () =>
                      bookingCancel.mutateAsync({ bookingId })
                    )
                  }
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  disabled={!currentUserId}
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    runTest("booking.complete", () =>
                      bookingComplete.mutateAsync({ bookingId })
                    )
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={currentUserRole !== Role.PRO}
                >
                  Complete (PRO)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {(testResult || error) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Test Results</h2>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 font-medium">Error:</p>
                <p className="text-red-600">{error}</p>
              </div>
            )}
            {testResult && (
              <div className="space-y-2">
                <p className="text-sm text-gray-900">
                  Test: <span className="font-medium">{testResult.name}</span> |{" "}
                  {testResult.timestamp}
                </p>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm text-gray-900">
                  {JSON.stringify(testResult.result || testResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
