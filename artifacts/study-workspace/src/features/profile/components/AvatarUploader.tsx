import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/auth/UserAvatar";
import {
  useDeleteAvatar,
  useUploadAvatar,
} from "../hooks/use-profile";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];

interface AvatarUploaderProps {
  name?: string | null;
  avatar?: string | null;
  size?: "md" | "lg";
  onUploaded?: (avatarUrl: string | null) => void;
}

export function AvatarUploader({
  name,
  avatar,
  size = "md",
  onUploaded,
}: AvatarUploaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const upload = useUploadAvatar();
  const remove = useDeleteAvatar();
  const { toast } = useToast();

  const isBusy = upload.isPending || remove.isPending;

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPT.includes(file.type)) {
      toast({
        title: "Unsupported file",
        description: "Use a PNG, JPG, WEBP or GIF image.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: "Image too large",
        description: "Maximum upload size is 2 MB.",
      });
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    upload.mutate(file, {
      onSuccess: (data) => {
        toast({ title: "Avatar updated" });
        onUploaded?.(data.avatar);
        // Revoke the preview after a short delay so the swap appears clean.
        setTimeout(() => {
          URL.revokeObjectURL(localUrl);
          setPreviewUrl(null);
        }, 200);
      },
      onError: (error) => {
        URL.revokeObjectURL(localUrl);
        setPreviewUrl(null);
        toast({
          title: "Upload failed",
          description:
            error instanceof Error ? error.message : "Unexpected error",
        });
      },
    });
  };

  const handleRemove = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Avatar removed" });
        onUploaded?.(null);
      },
      onError: (error) => {
        toast({
          title: "Could not remove avatar",
          description:
            error instanceof Error ? error.message : "Unexpected error",
        });
      },
    });
  };

  const displayedAvatar = previewUrl ?? avatar ?? null;
  const sizeClass = size === "lg" ? "h-24 w-24" : "h-16 w-16";

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        src={displayedAvatar}
        name={name}
        className={sizeClass}
        fallbackClassName="bg-primary/20 text-primary text-xl"
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => fileInput.current?.click()}
            disabled={isBusy}
            data-testid="button-upload-avatar"
          >
            {upload.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera size={13} />
            )}
            Upload Photo
          </Button>
          {avatar ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={isBusy}
              data-testid="button-remove-avatar"
            >
              {remove.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP or GIF · max 2 MB
        </p>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT.join(",")}
        onChange={handlePick}
        className="hidden"
        data-testid="input-avatar-file"
      />
    </div>
  );
}
