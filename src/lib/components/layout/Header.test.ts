// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import { get } from "svelte/store";
import Header from "./Header.svelte";
import {
  allRegionsAndDistricts,
  selectedRegionID,
  selectedDistrictID,
  selectedRegionName,
  selectedDistrictName,
} from "$lib/stores/uiStore";

// Regression test for #259: clearing the search field with the keyboard must
// reset the selected location stores (what the dashboards filter on) exactly
// like the (x) button does. Previously only the dropdown state was cleared,
// so the results stayed filtered on the deleted selection.
describe("Header search — clearing resets the selected location", () => {
  let component: ReturnType<typeof mount>;

  const selectDodomaChamwino = () => {
    selectedRegionID.set("r1");
    selectedDistrictID.set("d1");
    selectedRegionName.set("Dodoma");
    selectedDistrictName.set("Chamwino");
  };

  const selectedStores = () => [
    get(selectedRegionID),
    get(selectedDistrictID),
    get(selectedRegionName),
    get(selectedDistrictName),
  ];

  beforeEach(() => {
    // Pre-populate so onMount doesn't try to fetch regions over HTTP.
    allRegionsAndDistricts.set([
      {
        regionID: "r1",
        regionName: "Dodoma",
        districtID: "d1",
        districtName: "Chamwino",
      },
    ]);
    selectDodomaChamwino();
    component = mount(Header, { target: document.body });
    flushSync();
  });

  afterEach(() => {
    unmount(component);
    document.body.innerHTML = "";
    allRegionsAndDistricts.set([]);
    selectedRegionID.set(null);
    selectedDistrictID.set(null);
    selectedRegionName.set(null);
    selectedDistrictName.set(null);
  });

  const getSearchInput = (): HTMLInputElement => {
    const input =
      document.querySelector<HTMLInputElement>("input[type='text']");
    if (!input) throw new Error("search input not found");
    return input;
  };

  it("shows the current selection in the search field", () => {
    expect(getSearchInput().value).toBe("Dodoma > Chamwino");
  });

  it("resets the selection when the text is deleted via keyboard", () => {
    const input = getSearchInput();

    // Simulate select-all + delete: the field becomes empty and fires `input`.
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();

    expect(selectedStores()).toEqual([null, null, null, null]);
  });

  it("resets the selection via the (x) button (reference behaviour)", () => {
    const clearButton = document.querySelector<HTMLButtonElement>(
      "button[aria-label='Clear selection']",
    );
    if (!clearButton) throw new Error("clear button not found");

    clearButton.click();
    flushSync();

    expect(selectedStores()).toEqual([null, null, null, null]);
  });

  it("keyboard clear and (x) leave the component in the same state", () => {
    const input = getSearchInput();

    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();

    const afterKeyboard = selectedStores();

    // Re-select, then clear via the button and compare.
    selectDodomaChamwino();
    flushSync();
    const clearButton = document.querySelector<HTMLButtonElement>(
      "button[aria-label='Clear selection']",
    );
    if (!clearButton) throw new Error("clear button not found");
    clearButton.click();
    flushSync();

    expect(selectedStores()).toEqual(afterKeyboard);
    expect(getSearchInput().value).toBe("");
  });
});
