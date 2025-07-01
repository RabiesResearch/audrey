<script lang="ts">
  export let size: "sm" | "md" | "lg" = "md";
  export let message: string = "Loading...";

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const messageSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };
</script>

<div class="flex flex-col items-center justify-center p-8">
  <div
    class="animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 {sizeClasses[
      size
    ]}"
  ></div>
  <p class="mt-4 text-gray-600 {messageSizeClasses[size]}">{message}</p>
</div>
