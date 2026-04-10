import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Eye,
  FileText,
  MessageSquarePlus,
  Copy,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  MoreVertical,
  List,
  GitBranch,
  CheckSquare,
} from "lucide-react";
import { useForms, useMutation } from "../hooks/useApi";
import { apiClient } from "../api/client";
import { useNotification } from "../context/NotificationContext";

interface Form {
  _id: string;
  title: string;
  description: string;
  isVisible: boolean;
  isActive: boolean;
  sections: any[];
  questions: any[];
  createdAt: string;
  createdBy: any;
  responseCount?: number;
}

export default function FormsManagementNew() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: formsData, loading, error, execute: refetchForms } = useForms();
  const { showSuccess, showError, showConfirm } = useNotification();

  const deleteMutation = useMutation((id: string) => apiClient.deleteForm(id), {
    onSuccess: () => {
      refetchForms();
      showSuccess("Form deleted successfully", "Success");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to delete form", "Error");
    },
  });

  const duplicateMutation = useMutation(
    (id: string) => apiClient.duplicateForm(id),
    {
      onSuccess: () => {
        refetchForms();
        showSuccess("Form duplicated successfully", "Success");
      },
      onError: (error: any) => {
        showError(error.message || "Failed to duplicate form", "Error");
      },
    }
  );

  const visibilityMutation = useMutation(
    ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      apiClient.updateFormVisibility(id, isVisible),
    {
      onSuccess: (data, variables) => {
        refetchForms();
        showSuccess(
          `Form is now ${variables.isVisible ? "public" : "private"}`,
          "Visibility Updated"
        );
      },
      onError: (error: any) => {
        showError(error.message || "Failed to update visibility", "Error");
      },
    }
  );

  const forms = formsData?.forms || [];

  const filteredForms = forms.filter(
    (form: Form) =>
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, title: string) => {
    showConfirm(
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      async () => {
        await deleteMutation.mutate(id);
      },
      "Delete Form",
      "Delete",
      "Cancel"
    );
  };

  const handleDuplicate = async (id: string) => {
    await duplicateMutation.mutate(id);
  };

  const handleToggleVisibility = async (
    id: string,
    currentVisibility: boolean
  ) => {
    await visibilityMutation.mutate({
      id,
      isVisible: !currentVisibility,
    });
  };

  const handleCreateForm = () => {
    navigate("/forms/create");
  };

  const handleEditForm = (id: string) => {
    navigate(`/forms/${id}/edit`);
  };

  const handleViewResponses = (id: string) => {
    navigate(`/forms/${id}/responses`);
  };

  const handlePreviewForm = (id: string) => {
    navigate(`/forms/${id}/preview`);
  };

  const handleViewAnalytics = (id: string) => {
    navigate(`/forms/${id}/analytics`);
  };

  const handleFollowUpForm = (id: string) => {
    navigate(`/forms/${id}/follow-up-form`);
  };

  const handleFollowUpSection = (id: string) => {
    navigate(`/forms/${id}/follow-up-section`);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-primary-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading forms: {error}</p>
          <button onClick={() => refetchForms()} className="mt-4 btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold">Service Request Management</h1>
            <p>Create, edit, and manage service request forms</p>
          </div>
          <button
            onClick={handleCreateForm}
            className="btn-primary mt-2 sm:mt-0"
          >
            <PlusCircle className="w-3 h-3 mr-1" />
            Create New Service Form
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search service forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
          <FileText className="w-12 h-12 text-primary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary-600 mb-2">
            {searchTerm
              ? "No service forms found"
              : "No service forms created yet"}
          </h3>
          <p className="text-primary-500 mb-6">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Create your first service form to get started"}
          </p>
          {!searchTerm && (
            <button onClick={handleCreateForm} className="btn-primary">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Your First Form
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form: Form) => (
            <div
              key={form._id}
              className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium mb-1 line-clamp-2">
                    {form.title}
                  </h3>
                  <p className="text-sm line-clamp-2">{form.description}</p>
                </div>
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === form._id ? null : form._id
                      )
                    }
                    className="p-1 hover:bg-neutral-100 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-primary-400" />
                  </button>

                  {openDropdown === form._id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
                      <button
                        onClick={() => {
                          handleFollowUpForm(form._id);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 border-b border-neutral-100"
                      >
                        <GitBranch className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-sm">
                            Follow-up Form
                          </div>
                          <div className="text-xs text-neutral-500">
                            Create linked forms
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handleFollowUpSection(form._id);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <CheckSquare className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium text-sm">
                            Follow-up Section
                          </div>
                          <div className="text-xs text-neutral-500">
                            Configure option sections
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Stats */}
              <div className="flex items-center justify-between text-xs text-primary-500 mb-4">
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {form.responseCount || 0} responses
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(form.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Visibility Status */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    form.isVisible
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {form.isVisible ? "Public" : "Private"}
                </span>
                <button
                  onClick={() =>
                    handleToggleVisibility(form._id, form.isVisible)
                  }
                  className="text-xs text-primary-600 hover:text-primary-800"
                  disabled={visibilityMutation.loading}
                >
                  {visibilityMutation.loading ? "..." : "Toggle"}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreviewForm(form.id || form._id)}
                    className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg transition-colors hover:bg-primary-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditForm(form._id)}
                    className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit form"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewResponses(form._id)}
                    className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View responses"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewAnalytics(form._id)}
                    className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View analytics"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDuplicate(form._id)}
                    className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Duplicate form"
                    disabled={duplicateMutation.loading}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(form._id, form.title)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete form"
                    disabled={deleteMutation.loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
