<script lang="ts">
  import { ChevronDown, ChevronRight } from "@steeze-ui/heroicons";
  import { Icon } from "@steeze-ui/svelte-icon";

  type Props = {
    onclick: () => void;
    canExpand: boolean;
    isExpanded: boolean;
  };

  let { onclick, canExpand, isExpanded }: Props = $props();
</script>

<button disabled={!canExpand} {onclick}>
  {#if canExpand}
    <Icon
      src={isExpanded ? ChevronDown : ChevronRight}
      size="1.2em"
      theme="solid"
    />
  {/if}
</button>
