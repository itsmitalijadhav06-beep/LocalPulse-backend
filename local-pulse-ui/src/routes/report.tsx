import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ISSUE_CATEGORIES } from "@/constants";
import { Camera, MapPin, Sparkles, Loader2, Navigation, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { issueService } from "@/services/issue.service";
import { useQueryClient } from "@tanstack/react-query";
import { LocationPicker } from "@/components/LocationPicker";
import { useApp } from "@/contexts/AppContext";
import { useCitizenOnlyGuard } from "@/hooks/useRouteGuard";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(5, "Title is too short"),
  description: z.string().min(10, "Add a bit more detail"),
  category: z.enum(["road", "water", "electricity", "safety", "sanitation", "other"]),
  latitude: z.number(),
  longitude: z.number(),
  anonymous: z.boolean(),
});

type FormVals = z.infer<typeof schema>;

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Report Issue — LocalPulse" }] }),
  component: ReportPage,
});

function ReportPage() {
  // Admins cannot report issues
  const { isLoading: guardLoading } = useCitizenOnlyGuard();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userLocation } = useApp();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
  } | null>(userLocation.isSet ? userLocation : null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      latitude: userLocation.isSet ? userLocation.latitude : 0,
      longitude: userLocation.isSet ? userLocation.longitude : 0,
      anonymous: false,
      category: "road",
    },
  });

  if (guardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const category = watch("category");
  const anonymous = watch("anonymous");

  const handleLocationPicked = (loc: {
    latitude: number;
    longitude: number;
    city: string;
  }) => {
    setPickedLocation(loc);
    setValue("latitude", loc.latitude);
    setValue("longitude", loc.longitude);
    setShowLocationPicker(false);
  };

  const onSubmit = async (values: FormVals) => {
    setApiError(null);
    try {
      let image_url: string | undefined = undefined;

      if (photoFile) {
        try {
          image_url = await issueService.uploadImage(photoFile);
        } catch (uploadErr) {
          console.error("Failed to upload image, falling back to placeholder:", uploadErr);
          image_url = `https://images.unsplash.com/photo-1594913785162-e6785b423cb1?auto=format&fit=crop&q=80&w=600`;
        }
      }

      await issueService.create({
        title: values.title,
        description: values.description,
        category: values.category,
        latitude: values.latitude,
        longitude: values.longitude,
        anonymous: values.anonymous,
        image_url,
      });

      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setSubmitted(true);
      toast.success("Issue reported successfully! Thank you for making your city better.");

      // Navigate after a short delay to show success state
      setTimeout(() => {
        navigate({ to: "/my-reports" });
      }, 1800);
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message ?? "Failed to submit report. Please try again."
      );
      toast.error("Failed to submit report.");
    }
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhotoFile(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
  };

  // Success state
  if (submitted) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto text-center py-20 space-y-5">
          <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-950/30 grid place-items-center mx-auto">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold">Issue Reported!</h1>
          <p className="text-muted-foreground text-sm">
            Thank you for making your city better. Your report has been submitted and
            is now visible to the community.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Redirecting to My Reports...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Report a civic issue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Help your neighborhood by reporting issues that matter.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo */}
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <Label>Photo</Label>
            <label className="block aspect-[16/9] rounded-xl border-2 border-dashed bg-muted/40 hover:bg-muted cursor-pointer overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full grid place-items-center text-center p-6">
                  <div>
                    <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 font-medium text-sm">Add a photo</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG up to 5 MB</p>
                  </div>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/10 text-secondary px-3 py-2 rounded-lg">
              <Sparkles className="h-3.5 w-3.5" />
              AI will auto-suggest category and severity from your photo (coming soon)
            </div>
          </div>

          {/* Details */}
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="E.g. Large pothole near MG Road"
                className="mt-1.5 h-11"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe the issue, when it started, who is affected..."
                className="mt-1.5"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>
            <div>
              <Label>Category</Label>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ISSUE_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setValue("category", c.value)}
                    className={cn(
                      "px-2 py-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-colors",
                      category === c.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-muted"
                    )}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Location</Label>
              {pickedLocation && (
                <span className="text-xs text-muted-foreground">
                  {pickedLocation.latitude.toFixed(5)}, {pickedLocation.longitude.toFixed(5)}
                </span>
              )}
            </div>

            {pickedLocation ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border bg-primary/5 border-primary/20">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{pickedLocation.city}</div>
                  <div className="text-xs text-muted-foreground">
                    {pickedLocation.latitude.toFixed(5)}, {pickedLocation.longitude.toFixed(5)}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-auto shrink-0"
                  onClick={() => setShowLocationPicker(true)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="w-full flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed hover:bg-muted transition-colors"
              >
                <Navigation className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm font-medium">Select issue location</div>
                <div className="text-xs text-muted-foreground">
                  Pin on map or use your current location
                </div>
              </button>
            )}

            {errors.latitude && (
              <p className="text-xs text-destructive">Please select a location on the map</p>
            )}
          </div>

          {/* Anonymous toggle */}
          <div className="bg-card border rounded-2xl p-5 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">Report anonymously</div>
              <p className="text-xs text-muted-foreground">
                Your name and avatar won't be shown publicly.
              </p>
            </div>
            <Switch
              checked={anonymous}
              onCheckedChange={(v) => setValue("anonymous", v)}
            />
          </div>

          {apiError && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {apiError}
            </p>
          )}

          <div className="flex gap-3 sticky bottom-20 lg:static bg-background/80 backdrop-blur lg:bg-transparent p-2 lg:p-0 -mx-2 lg:mx-0 rounded-xl">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => navigate({ to: "/feed" })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !pickedLocation}
              className="flex-1 h-12 text-base font-semibold"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit report"
              )}
            </Button>
          </div>
        </form>
      </div>

      {showLocationPicker && (
        <LocationPicker
          value={pickedLocation}
          onChange={handleLocationPicked}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </AppShell>
  );
}
