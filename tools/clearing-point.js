"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const REQUIRED = [
    "auction_date",
    "instrument_type",
    "tenor",
    "tenor_days",
    "amount_offered",
    "tenders_received",
    "amount_awarded",
    "accepted_yield",
  ];

  const SAMPLE_CSV = `auction_date,instrument_type,tenor,tenor_days,amount_offered,tenders_received,amount_awarded,accepted_yield
2026-05-04,T-Bill,91-day,91,7000,14780,7000,5.611
2026-05-04,T-Bill,182-day,182,7000,12110,6800,5.748
2026-05-04,T-Bill,364-day,364,6000,10020,6000,5.902
2026-05-18,T-Bill,91-day,91,7000,15890,7000,5.584
2026-05-18,T-Bill,182-day,182,7000,13240,7000,5.721
2026-05-18,T-Bill,364-day,364,6000,9570,5600,5.941
2026-06-01,T-Bill,91-day,91,7000,14960,7000,5.603
2026-06-01,T-Bill,182-day,182,7000,11540,6200,5.777
2026-06-01,T-Bill,364-day,364,6000,12420,6000,5.918
2026-06-15,T-Bill,91-day,91,7000,16320,7000,5.642
2026-06-15,T-Bill,182-day,182,7000,13670,7000,5.871
2026-06-15,T-Bill,364-day,364,6000,11620,6000,5.879
2026-06-29,T-Bill,91-day,91,7000,15990,7000,5.667
2026-06-29,T-Bill,182-day,182,7000,12910,6500,5.846
2026-06-29,T-Bill,364-day,364,6000,10830,6000,5.921
2026-07-13,T-Bill,91-day,91,7000,16320,7000,5.712
2026-07-13,T-Bill,182-day,182,7000,13370,6400,5.821
2026-07-13,T-Bill,364-day,364,6000,12480,6000,5.963
2026-06-09,T-Bond,5-year,1825,30000,51200,30000,6.071
2026-07-07,T-Bond,5-year,1825,30000,45800,26000,6.138
2026-06-23,T-Bond,10-year,3650,30000,36800,24500,6.291`;

  const state = {
    records: [],
    filtered: [],
    selectedId: null,
    source: "",
    search: "",
    sortKey: "auction_date",
    sortDirection: "desc",
    tapeIndex: 0,
    confirmationAction: null,
  };

  const ui = {
    datasetStatus: $("datasetStatus"),
    recordCount: $("recordCount"),
    latestAuctionDate: $("latestAuctionDate"),
    activeFilterSummary: $("activeFilterSummary"),

    dataDock: $("dataDock"),
    toggleDataDockButton: $("toggleDataDockButton"),
    closeDataDockButton: $("closeDataDockButton"),

    csvFileInput: $("csvFileInput"),
    uploadCsvButton: $("uploadCsvButton"),
    openPasteCsvButton: $("openPasteCsvButton"),
    openManualEntryButton: $("openManualEntryButton"),
    loadSampleDataButton: $("loadSampleDataButton"),
    downloadTemplateButton: $("downloadTemplateButton"),

    openDatasetManagerButton: $("openDatasetManagerButton"),
    openSavedDatasetsButton: $("openSavedDatasetsButton"),
    datasetManagerDialog: $("datasetManagerDialog"),
    closeDatasetManagerButton: $("closeDatasetManagerButton"),

    saveDatasetButton: $("saveDatasetButton"),
    exportDataButton: $("exportDataButton"),
    exportProcessedCsvButton: $("exportProcessedCsvButton"),
    downloadVisibleTableButton: $("downloadVisibleTableButton"),

    instrumentFilter: $("instrumentFilter"),
    tenorFilter: $("tenorFilter"),
    awardStatusFilter: $("awardStatusFilter"),
    startDateFilter: $("startDateFilter"),
    endDateFilter: $("endDateFilter"),
    applyFiltersButton: $("applyFiltersButton"),
    clearFiltersButton: $("clearFiltersButton"),

    clearCurrentDatasetButton: $("clearCurrentDatasetButton"),
    resetDashboardButton: $("resetDashboardButton"),

    auctionTapeTrack: $("auctionTapeTrack"),
    auctionTapePreviousButton: $("auctionTapePreviousButton"),
    auctionTapeNextButton: $("auctionTapeNextButton"),

    overviewCoverRatio: $("overviewCoverRatio"),
    overviewCoverContext: $("overviewCoverContext"),
    overviewAcceptedYield: $("overviewAcceptedYield"),
    overviewYieldContext: $("overviewYieldContext"),
    overviewYieldShift: $("overviewYieldShift"),
    overviewShiftContext: $("overviewShiftContext"),

    auctionFlowRecordSelect: $("auctionFlowRecordSelect"),
    flowAmountOffered: $("flowAmountOffered"),
    flowTendersReceived: $("flowTendersReceived"),
    flowAmountAwarded: $("flowAmountAwarded"),
    flowAmountOfferedBar: $("flowAmountOfferedBar"),
    flowTendersReceivedBar: $("flowTendersReceivedBar"),
    flowAmountAwardedBar: $("flowAmountAwardedBar"),
    flowBidToCover: $("flowBidToCover"),
    flowAwardToOffer: $("flowAwardToOffer"),
    flowAcceptanceRatio: $("flowAcceptanceRatio"),
    flowClearingStatus: $("flowClearingStatus"),

    clearingSignalLight: $("clearingSignalLight"),
    clearingDemandSignal: $("clearingDemandSignal"),
    clearingAcceptedYield: $("clearingAcceptedYield"),
    clearingYieldMovement: $("clearingYieldMovement"),
    clearingBidToCover: $("clearingBidToCover"),
    clearingAwardStatus: $("clearingAwardStatus"),

    pressureGaugeFill: $("pressureGaugeFill"),
    pressureGaugeReading: $("pressureGaugeReading"),

    strongestDemandTenor: $("strongestDemandTenor"),
    weakestDemandTenor: $("weakestDemandTenor"),
    largestYieldIncreaseTenor: $("largestYieldIncreaseTenor"),
    largestYieldDeclineTenor: $("largestYieldDeclineTenor"),

    selectedAuctionDate: $("selectedAuctionDate"),
    selectedInstrument: $("selectedInstrument"),
    selectedTenor: $("selectedTenor"),
    selectedRecentCover: $("selectedRecentCover"),
    selectedRecentYield: $("selectedRecentYield"),

    signalFeed: $("signalFeed"),

    tenorMatrix: $("tenorMatrix"),
    matrixSummary: $("matrixSummary"),

    auctionTableSearch: $("auctionTableSearch"),
    auctionTableBody: $("auctionTableBody"),
    visibleRecordCount: $("visibleRecordCount"),
    tableSortSummary: $("tableSortSummary"),

    chartEmptyState: $("chartEmptyState"),

    pasteCsvDialog: $("pasteCsvDialog"),
    pastedCsvInput: $("pastedCsvInput"),
    pasteCsvValidationMessage: $("pasteCsvValidationMessage"),
    processPastedCsvButton: $("processPastedCsvButton"),

    manualEntryDialog: $("manualEntryDialog"),
    manualEntryForm: $("manualEntryForm"),
    manualEntryValidationMessage: $("manualEntryValidationMessage"),
    closeManualEntryButton: $("closeManualEntryButton"),
    cancelManualEntryButton: $("cancelManualEntryButton"),

    confirmationDialog: $("confirmationDialog"),
    confirmationTitle: $("confirmationTitle"),
    confirmationMessage: $("confirmationMessage"),
    confirmationCancelButton: $("confirmationCancelButton"),
    confirmationProceedButton: $("confirmationProceedButton"),

    toastRegion: $("toastRegion"),

    auctionTapeItemTemplate: $("auctionTapeItemTemplate"),
    tenorCardTemplate: $("tenorCardTemplate"),
    signalFeedItemTemplate: $("signalFeedItemTemplate"),

    tableSortButtons: [
      ...document.querySelectorAll(".table-sort-button"),
    ],

    chartButtons: [
      ...document.querySelectorAll(".chart-view-button"),
    ],
  };

  bindEvents();
  resetDashboard(false);

  function bindEvents() {
    ui.uploadCsvButton.addEventListener("click", () => {
      ui.csvFileInput.click();
    });

    ui.csvFileInput.addEventListener("change", uploadCsv);

    ui.openPasteCsvButton.addEventListener("click", () => {
      clearValidation(ui.pasteCsvValidationMessage);
      openDialog(ui.pasteCsvDialog);
      ui.pastedCsvInput.focus();
    });

    ui.processPastedCsvButton.addEventListener(
      "click",
      processPastedCsv
    );

    ui.openManualEntryButton.addEventListener(
      "click",
      openManualEntry
    );

    ui.manualEntryForm.addEventListener(
      "submit",
      addManualRecord
    );

    ui.closeManualEntryButton.addEventListener("click", () => {
      ui.manualEntryDialog.close();
    });

    ui.cancelManualEntryButton.addEventListener("click", () => {
      ui.manualEntryDialog.close();
    });

    ui.loadSampleDataButton.addEventListener("click", () => {
      try {
        loadDataset(
          parseCsv(SAMPLE_CSV),
          "Illustrative dataset"
        );
      } catch (error) {
        toast(error.message, "error");
      }
    });

    ui.downloadTemplateButton.addEventListener(
      "click",
      downloadTemplate
    );

    ui.instrumentFilter.addEventListener(
      "change",
      populateTenorFilter
    );

    ui.applyFiltersButton.addEventListener(
      "click",
      applyFilters
    );

    ui.clearFiltersButton.addEventListener(
      "click",
      clearFilters
    );

    ui.auctionFlowRecordSelect.addEventListener(
      "change",
      () => {
        state.selectedId =
          ui.auctionFlowRecordSelect.value;

        renderSelected();
      }
    );

    ui.auctionTableSearch.addEventListener("input", () => {
      state.search = ui.auctionTableSearch.value
        .trim()
        .toLowerCase();

      renderTable();
    });

    ui.tableSortButtons.forEach((button) => {
      button.addEventListener("click", () => {
        changeSort(button.dataset.sortKey);
      });
    });

    ui.auctionTableBody.addEventListener(
      "click",
      selectTableRow
    );

    ui.auctionTapePreviousButton.addEventListener(
      "click",
      () => {
        moveTape(-1);
      }
    );

    ui.auctionTapeNextButton.addEventListener(
      "click",
      () => {
        moveTape(1);
      }
    );

    ui.clearCurrentDatasetButton.addEventListener(
      "click",
      () => {
        confirmAction(
          "Clear current dataset?",
          "All loaded auction records will be removed.",
          () => resetDashboard(true)
        );
      }
    );

    ui.resetDashboardButton.addEventListener(
      "click",
      () => {
        confirmAction(
          "Reset dashboard?",
          "This clears the dataset, filters, search, and current selection.",
          () => resetDashboard(true)
        );
      }
    );

    ui.confirmationCancelButton.addEventListener(
      "click",
      closeConfirmation
    );

    ui.confirmationProceedButton.addEventListener(
      "click",
      runConfirmation
    );

    ui.toggleDataDockButton.addEventListener(
      "click",
      toggleDataDock
    );

    ui.closeDataDockButton.addEventListener(
      "click",
      () => {
        setDataDockOpen(false);
      }
    );

    ui.openDatasetManagerButton.addEventListener(
      "click",
      () => {
        openDialog(ui.datasetManagerDialog);
      }
    );

    ui.openSavedDatasetsButton.addEventListener(
      "click",
      () => {
        openDialog(ui.datasetManagerDialog);
      }
    );

    ui.closeDatasetManagerButton.addEventListener(
      "click",
      () => {
        ui.datasetManagerDialog.close();
      }
    );

    [
      ui.saveDatasetButton,
      ui.exportDataButton,
      ui.exportProcessedCsvButton,
      ui.downloadVisibleTableButton,
    ].forEach((button) => {
      button.addEventListener("click", () => {
        toast(
          "This control is activated in Pass 5.",
          "warning"
        );
      });
    });

    ui.chartButtons.forEach((button) => {
      button.addEventListener("click", () => {
        toast(
          "Interactive charts are added in Pass 4.",
          "warning"
        );
      });
    });

    [
      ui.pasteCsvDialog,
      ui.manualEntryDialog,
      ui.datasetManagerDialog,
      ui.confirmationDialog,
    ].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          dialog.close();
        }
      });
    });
  }

  async function uploadCsv() {
    const file = ui.csvFileInput.files?.[0];

    if (!file) {
      return;
    }

    try {
      const csvText = await file.text();

      loadDataset(
        parseCsv(csvText),
        file.name
      );
    } catch (error) {
      toast(
        error.message || "The CSV could not be processed.",
        "error"
      );
    } finally {
      ui.csvFileInput.value = "";
    }
  }

  function processPastedCsv() {
    clearValidation(ui.pasteCsvValidationMessage);

    try {
      loadDataset(
        parseCsv(ui.pastedCsvInput.value),
        "Pasted CSV"
      );

      ui.pastedCsvInput.value = "";
      ui.pasteCsvDialog.close();
    } catch (error) {
      validation(
        ui.pasteCsvValidationMessage,
        error.message,
        "error"
      );
    }
  }

  function openManualEntry() {
    ui.manualEntryForm.reset();
    clearValidation(ui.manualEntryValidationMessage);
    openDialog(ui.manualEntryDialog);
  }

  function addManualRecord(event) {
    event.preventDefault();
    clearValidation(ui.manualEntryValidationMessage);

    try {
      const newRow = Object.fromEntries(
        new FormData(ui.manualEntryForm).entries()
      );

      const rawRows = [
        ...state.records.map(rawFields),
        newRow,
      ];

      const processed = validateAndProcess(rawRows);

      state.records = processed;
      state.filtered = [...processed];
      state.source ||= "Manual dataset";
      state.selectedId =
        latest(processed)?.id || null;

      clearFilterInputs();
      populateControls();
      renderAll();

      ui.manualEntryForm.reset();
      ui.manualEntryDialog.close();

      toast(
        "Auction record added.",
        "success"
      );
    } catch (error) {
      validation(
        ui.manualEntryValidationMessage,
        error.message,
        "error"
      );
    }
  }

  function parseCsv(text) {
    const input = String(text || "")
      .replace(/^\uFEFF/, "")
      .trim();

    if (!input) {
      throw new Error("The CSV is empty.");
    }

    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (
      let index = 0;
      index < input.length;
      index += 1
    ) {
      const character = input[index];
      const nextCharacter = input[index + 1];

      if (character === "\"") {
        if (quoted && nextCharacter === "\"") {
          field += "\"";
          index += 1;
        } else {
          quoted = !quoted;
        }

        continue;
      }

      if (character === "," && !quoted) {
        row.push(field.trim());
        field = "";
        continue;
      }

      if (
        (character === "\n" ||
          character === "\r") &&
        !quoted
      ) {
        if (
          character === "\r" &&
          nextCharacter === "\n"
        ) {
          index += 1;
        }

        row.push(field.trim());
        field = "";

        if (row.some(Boolean)) {
          rows.push(row);
        }

        row = [];
        continue;
      }

      field += character;
    }

    if (quoted) {
      throw new Error(
        "The CSV contains an unclosed quoted field."
      );
    }

    row.push(field.trim());

    if (row.some(Boolean)) {
      rows.push(row);
    }

    if (rows.length < 2) {
      throw new Error(
        "The CSV needs a header and at least one data row."
      );
    }

    const headers = rows[0].map((value) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
    );

    const missing = REQUIRED.filter(
      (name) => !headers.includes(name)
    );

    if (missing.length) {
      throw new Error(
        `Missing required column${
          missing.length > 1 ? "s" : ""
        }: ${missing.join(", ")}`
      );
    }

    return rows.slice(1).map(
      (values, index) => {
        const result = {
          __row: index + 2,
        };

        headers.forEach((header, column) => {
          result[header] =
            values[column] ?? "";
        });

        return result;
      }
    );
  }

  function loadDataset(rows, source) {
    state.records = validateAndProcess(rows);
    state.filtered = [...state.records];
    state.source = source;
    state.selectedId =
      latest(state.records)?.id || null;
    state.search = "";
    state.sortKey = "auction_date";
    state.sortDirection = "desc";
    state.tapeIndex = 0;

    clearFilterInputs();
    populateControls();
    renderAll();

    toast(
      `${state.records.length} records loaded from ${source}.`,
      "success"
    );
  }

  function validateAndProcess(rows) {
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error(
        "No auction records were provided."
      );
    }

    const errors = [];
    const normalized = [];
    const duplicates = new Set();

    rows.forEach((row, index) => {
      const rowNumber =
        row.__row || index + 1;

      const record = normalizeRow(
        row,
        rowNumber,
        errors
      );

      if (!record) {
        return;
      }

      const duplicateKey = [
        record.auction_date,
        record.instrument_type,
        record.tenor_days,
      ].join("|");

      if (duplicates.has(duplicateKey)) {
        errors.push(
          `Row ${rowNumber}: duplicate date, instrument, and tenor.`
        );
      } else {
        duplicates.add(duplicateKey);
        normalized.push(record);
      }
    });

    if (errors.length) {
      const preview = errors
        .slice(0, 8)
        .join("\n");

      const remaining =
        errors.length - 8;

      throw new Error(
        remaining > 0
          ? `${preview}\n…and ${remaining} more error(s).`
          : preview
      );
    }

    normalized.sort(
      (first, second) =>
        first.auction_date.localeCompare(
          second.auction_date
        ) ||
        first.tenor_days -
          second.tenor_days
    );

    const histories = new Map();

    return normalized.map(
      (row, index) => {
        const historyKey =
          `${row.instrument_type}|${row.tenor_days}`;

        const history =
          histories.get(historyKey) || [];

        const previous =
          history.at(-1) || null;

        const priorThree =
          history.slice(-3);

        const record = {
          ...row,

          id: [
            row.auction_date,
            row.instrument_type.replace(
              /\W/g,
              ""
            ),
            row.tenor_days,
            index,
          ].join("-"),

          bid_to_cover:
            row.tenders_received /
            row.amount_offered,

          award_to_offer:
            (row.amount_awarded /
              row.amount_offered) *
            100,

          acceptance_ratio:
            row.tenders_received === 0
              ? 0
              : (row.amount_awarded /
                  row.tenders_received) *
                100,

          yield_change_bps: previous
            ? (row.accepted_yield -
                previous.accepted_yield) *
              100
            : null,

          previous_yield:
            previous?.accepted_yield ??
            null,

          recent_average_cover:
            average(
              priorThree.map(
                (item) =>
                  item.bid_to_cover
              )
            ),

          recent_average_yield:
            average(
              priorThree.map(
                (item) =>
                  item.accepted_yield
              )
            ),

          award_status:
            awardStatus(row),
        };

        record.demand_signal =
          demandSignal(
            record.bid_to_cover
          );

        history.push(record);
        histories.set(
          historyKey,
          history
        );

        return record;
      }
    );
  }

  function normalizeRow(
    row,
    rowNumber,
    errors
  ) {
    const record = {
      auction_date:
        normalizeDate(
          row.auction_date
        ),

      instrument_type:
        normalizeInstrument(
          row.instrument_type
        ),

      tenor:
        String(row.tenor || "")
          .trim(),

      tenor_days:
        number(row.tenor_days),

      amount_offered:
        number(row.amount_offered),

      tenders_received:
        number(row.tenders_received),

      amount_awarded:
        number(row.amount_awarded),

      accepted_yield:
        number(row.accepted_yield),
    };

    const rowErrors = [];

    if (!record.auction_date) {
      rowErrors.push(
        `Row ${rowNumber}: invalid auction_date.`
      );
    }

    if (!record.instrument_type) {
      rowErrors.push(
        `Row ${rowNumber}: instrument_type must be T-Bill or T-Bond.`
      );
    }

    if (!record.tenor) {
      rowErrors.push(
        `Row ${rowNumber}: tenor is required.`
      );
    }

    if (
      !Number.isInteger(
        record.tenor_days
      ) ||
      record.tenor_days <= 0
    ) {
      rowErrors.push(
        `Row ${rowNumber}: tenor_days must be a positive integer.`
      );
    }

    if (
      !Number.isFinite(
        record.amount_offered
      ) ||
      record.amount_offered <= 0
    ) {
      rowErrors.push(
        `Row ${rowNumber}: amount_offered must be greater than zero.`
      );
    }

    if (
      !Number.isFinite(
        record.tenders_received
      ) ||
      record.tenders_received < 0
    ) {
      rowErrors.push(
        `Row ${rowNumber}: tenders_received cannot be negative.`
      );
    }

    if (
      !Number.isFinite(
        record.amount_awarded
      ) ||
      record.amount_awarded < 0
    ) {
      rowErrors.push(
        `Row ${rowNumber}: amount_awarded cannot be negative.`
      );
    }

    if (
      !Number.isFinite(
        record.accepted_yield
      ) ||
      record.accepted_yield < 0
    ) {
      rowErrors.push(
        `Row ${rowNumber}: accepted_yield must be zero or greater.`
      );
    }

    if (
      Number.isFinite(
        record.amount_awarded
      ) &&
      Number.isFinite(
        record.tenders_received
      ) &&
      record.amount_awarded >
        record.tenders_received
    ) {
      rowErrors.push(
        `Row ${rowNumber}: amount_awarded cannot exceed tenders_received.`
      );
    }

    errors.push(...rowErrors);

    return rowErrors.length
      ? null
      : record;
  }

  function normalizeDate(value) {
    const text = String(value || "")
      .trim();

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        text
      ) &&
      !Number.isNaN(
        new Date(
          `${text}T00:00:00Z`
        ).getTime()
      )
    ) {
      return text;
    }

    const date = new Date(text);

    if (
      Number.isNaN(date.getTime())
    ) {
      return null;
    }

    return [
      date.getUTCFullYear(),
      String(
        date.getUTCMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getUTCDate()
      ).padStart(2, "0"),
    ].join("-");
  }

  function normalizeInstrument(value) {
    const text = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[._-]/g, " ")
      .replace(/\s+/g, " ");

    if (
      [
        "t bill",
        "tbill",
        "treasury bill",
        "treasury bills",
      ].includes(text)
    ) {
      return "T-Bill";
    }

    if (
      [
        "t bond",
        "tbond",
        "treasury bond",
        "treasury bonds",
      ].includes(text)
    ) {
      return "T-Bond";
    }

    return null;
  }

  function number(value) {
    const cleaned = String(
      value ?? ""
    )
      .trim()
      .replace(/[₱,%\s]/g, "")
      .replace(/,/g, "");

    return cleaned === ""
      ? Number.NaN
      : Number(cleaned);
  }

  function average(values) {
    const valid = values.filter(
      Number.isFinite
    );

    return valid.length
      ? valid.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / valid.length
      : null;
  }

  function awardStatus(record) {
    if (
      record.amount_awarded === 0
    ) {
      return "none";
    }

    return record.amount_awarded >=
      record.amount_offered * 0.995
      ? "full"
      : "partial";
  }

  function demandSignal(cover) {
    if (cover < 1) {
      return "Undersubscribed";
    }

    if (cover < 1.25) {
      return "Thin demand";
    }

    if (cover < 2) {
      return "Moderate demand";
    }

    return "Strong demand";
  }

  function rawFields(record) {
    const result = {};

    REQUIRED.forEach((key) => {
      result[key] = record[key];
    });

    return result;
  }

  function populateControls() {
    populateTenorFilter();
    populateFlowSelect();
    setInputsEnabled(true);
  }

  function populateTenorFilter() {
    const current =
      ui.tenorFilter.value;

    const instrument =
      ui.instrumentFilter.value;

    const records =
      instrument === "all"
        ? state.records
        : state.records.filter(
            (record) =>
              record.instrument_type ===
              instrument
          );

    const tenors = [
      ...new Map(
        records.map((record) => [
          record.tenor_days,
          record,
        ])
      ).values(),
    ].sort(
      (first, second) =>
        first.tenor_days -
        second.tenor_days
    );

    ui.tenorFilter.replaceChildren(
      new Option(
        "All tenors",
        "all"
      )
    );

    tenors.forEach((record) => {
      ui.tenorFilter.add(
        new Option(
          record.tenor,
          String(
            record.tenor_days
          )
        )
      );
    });

    const currentExists = [
      ...ui.tenorFilter.options,
    ].some(
      (option) =>
        option.value === current
    );

    ui.tenorFilter.value =
      currentExists
        ? current
        : "all";
  }

  function populateFlowSelect() {
    const records = [
      ...state.filtered,
    ].sort(
      (first, second) =>
        second.auction_date.localeCompare(
          first.auction_date
        ) ||
        second.tenor_days -
          first.tenor_days
    );

    ui.auctionFlowRecordSelect
      .replaceChildren();

    records.forEach((record) => {
      ui.auctionFlowRecordSelect.add(
        new Option(
          `${formatDate(
            record.auction_date
          )} · ${record.tenor} · ${record.instrument_type}`,
          record.id
        )
      );
    });

    const selectionExists =
      records.some(
        (record) =>
          record.id ===
          state.selectedId
      );

    if (!selectionExists) {
      state.selectedId =
        records[0]?.id || null;
    }

    ui.auctionFlowRecordSelect
      .value =
      state.selectedId || "";
  }

  function applyFilters() {
    const start =
      ui.startDateFilter.value;

    const end =
      ui.endDateFilter.value;

    if (
      start &&
      end &&
      start > end
    ) {
      toast(
        "Start date cannot be after end date.",
        "error"
      );

      return;
    }

    state.filtered =
      state.records.filter(
        (record) =>
          (
            ui.instrumentFilter
              .value === "all" ||
            record.instrument_type ===
              ui.instrumentFilter
                .value
          ) &&
          (
            ui.tenorFilter.value ===
              "all" ||
            record.tenor_days ===
              Number(
                ui.tenorFilter.value
              )
          ) &&
          (
            ui.awardStatusFilter
              .value === "all" ||
            record.award_status ===
              ui.awardStatusFilter
                .value
          ) &&
          (
            !start ||
            record.auction_date >=
              start
          ) &&
          (
            !end ||
            record.auction_date <=
              end
          )
      );

    state.selectedId =
      latest(state.filtered)?.id ||
      null;

    state.tapeIndex = 0;

    populateFlowSelect();
    renderAll();

    toast(
      `${state.filtered.length} matching record${
        state.filtered.length === 1
          ? ""
          : "s"
      }.`,
      state.filtered.length
        ? "success"
        : "warning"
    );
  }

  function clearFilters() {
    clearFilterInputs();

    state.filtered = [
      ...state.records,
    ];

    state.selectedId =
      latest(state.filtered)?.id ||
      null;

    populateControls();
    renderAll();

    toast(
      "Filters cleared.",
      "success"
    );
  }

  function clearFilterInputs() {
    ui.instrumentFilter.value =
      "all";

    ui.awardStatusFilter.value =
      "all";

    ui.startDateFilter.value = "";
    ui.endDateFilter.value = "";
    ui.auctionTableSearch.value =
      "";

    state.search = "";
  }

  function renderAll() {
    renderHeader();
    renderTape();
    renderSelected();
    renderLeaders();
    renderMatrix();
    renderTable();
    renderChartPlaceholder();
    updateControls();
  }

  function renderHeader() {
    const currentLatest =
      latest(state.filtered);

    ui.datasetStatus.textContent =
      state.records.length
        ? "DATA READY"
        : "NO DATA LOADED";

    ui.datasetStatus.className =
      state.records.length
        ? "status-chip status-chip--ready"
        : "status-chip status-chip--idle";

    ui.recordCount.textContent =
      String(state.filtered.length);

    ui.latestAuctionDate.textContent =
      currentLatest
        ? formatDate(
            currentLatest.auction_date
          )
        : "—";

    const filters = [];

    if (
      ui.instrumentFilter.value !==
      "all"
    ) {
      filters.push(
        ui.instrumentFilter.value
          .toUpperCase()
      );
    }

    if (
      ui.tenorFilter.value !== "all"
    ) {
      filters.push(
        ui.tenorFilter
          .selectedOptions[0]
          ?.textContent
          .toUpperCase()
      );
    }

    if (
      ui.awardStatusFilter.value !==
      "all"
    ) {
      filters.push(
        `${ui.awardStatusFilter.value.toUpperCase()} AWARD`
      );
    }

    if (
      ui.startDateFilter.value ||
      ui.endDateFilter.value
    ) {
      filters.push("DATE RANGE");
    }

    ui.activeFilterSummary
      .textContent =
      filters.length
        ? filters.join(" · ")
        : "ALL RECORDS";
  }

  function renderTape() {
    ui.auctionTapeTrack
      .replaceChildren();

    const records = [
      ...state.filtered,
    ]
      .sort(
        (first, second) =>
          second.auction_date
            .localeCompare(
              first.auction_date
            ) ||
          second.tenor_days -
            first.tenor_days
      )
      .slice(0, 10);

    if (!records.length) {
      ui.auctionTapePreviousButton
        .disabled = true;

      ui.auctionTapeNextButton
        .disabled = true;

      const empty =
        document.createElement(
          "span"
        );

      empty.className =
        "auction-tape__empty";

      empty.textContent =
        "Load auction data to initialize the market tape.";

      ui.auctionTapeTrack
        .appendChild(empty);

      updateTape();
      return;
    }

    records.forEach((record) => {
      const fragment =
        ui.auctionTapeItemTemplate
          .content
          .cloneNode(true);

      fragment.querySelector(
        '[data-field="tenor"]'
      ).textContent =
        record.tenor;

      fragment.querySelector(
        '[data-field="yield"]'
      ).textContent =
        formatYield(
          record.accepted_yield
        );

      const shift =
        fragment.querySelector(
          '[data-field="shift"]'
        );

      shift.textContent =
        formatBps(
          record.yield_change_bps
        );

      directionClass(
        shift,
        record.yield_change_bps,
        true
      );

      const cover =
        fragment.querySelector(
          '[data-field="cover"]'
        );

      cover.textContent =
        `${record.bid_to_cover.toFixed(
          2
        )}× COVER`;

      cover.classList.add(
        demandClass(
          record.bid_to_cover
        )
      );

      fragment.querySelector(
        '[data-field="status"]'
      ).textContent =
        formatAward(
          record.award_status
        );

      const item =
        fragment.querySelector(
          ".auction-tape-item"
        );

      item.addEventListener(
        "click",
        () => {
          selectRecord(record.id);
        }
      );

      ui.auctionTapeTrack
        .appendChild(fragment);
    });

    ui.auctionTapePreviousButton
      .disabled =
      records.length <= 1;

    ui.auctionTapeNextButton
      .disabled =
      records.length <= 1;

    updateTape();
  }

  function moveTape(direction) {
    const maximumIndex =
      ui.auctionTapeTrack
        .children.length - 1;

    state.tapeIndex = Math.max(
      0,
      Math.min(
        maximumIndex,
        state.tapeIndex +
          direction
      )
    );

    updateTape();
  }

  function updateTape() {
    ui.auctionTapeTrack
      .style.transform =
      `translateX(-${
        state.tapeIndex * 210
      }px)`;
  }

  function renderSelected() {
    const record = selected();

    if (!record) {
      renderNoSelection();
      return;
    }

    ui.overviewCoverRatio
      .textContent =
      `${record.bid_to_cover.toFixed(
        2
      )}×`;

    ui.overviewCoverContext
      .textContent =
      `${record.tenor} · ${formatDate(
        record.auction_date
      )}`;

    ui.overviewAcceptedYield
      .textContent =
      formatYield(
        record.accepted_yield
      );

    ui.overviewYieldContext
      .textContent =
      `${record.instrument_type} accepted yield`;

    ui.overviewYieldShift
      .textContent =
      formatBps(
        record.yield_change_bps
      );

    ui.overviewShiftContext
      .textContent =
      record.previous_yield ===
      null
        ? "No previous same-tenor auction"
        : `Previous: ${formatYield(
            record.previous_yield
          )}`;

    directionClass(
      ui.overviewYieldShift,
      record.yield_change_bps,
      true
    );

    ui.flowAmountOffered
      .textContent =
      formatAmount(
        record.amount_offered
      );

    ui.flowTendersReceived
      .textContent =
      formatAmount(
        record.tenders_received
      );

    ui.flowAmountAwarded
      .textContent =
      formatAmount(
        record.amount_awarded
      );

    const maximumAmount =
      Math.max(
        record.amount_offered,
        record.tenders_received,
        record.amount_awarded,
        1
      );

    requestAnimationFrame(() => {
      ui.flowAmountOfferedBar
        .style.width =
        `${
          (
            record.amount_offered /
            maximumAmount
          ) * 100
        }%`;

      ui.flowTendersReceivedBar
        .style.width =
        `${
          (
            record.tenders_received /
            maximumAmount
          ) * 100
        }%`;

      ui.flowAmountAwardedBar
        .style.width =
        `${
          (
            record.amount_awarded /
            maximumAmount
          ) * 100
        }%`;
    });

    ui.flowBidToCover.textContent =
      `${record.bid_to_cover.toFixed(
        2
      )}×`;

    ui.flowAwardToOffer
      .textContent =
      formatPercent(
        record.award_to_offer
      );

    ui.flowAcceptanceRatio
      .textContent =
      formatPercent(
        record.acceptance_ratio
      );

    ui.flowClearingStatus
      .textContent =
      `${formatAward(
        record.award_status
      )} · ${
        record.bid_to_cover < 1
          ? "UNDERSUBSCRIBED"
          : "OVERSUBSCRIBED"
      }`;

    ui.clearingDemandSignal
      .textContent =
      record.demand_signal
        .toUpperCase();

    semanticClass(
      ui.clearingDemandSignal,
      demandClass(
        record.bid_to_cover
      )
    );

    ui.clearingAcceptedYield
      .textContent =
      formatYield(
        record.accepted_yield
      );

    ui.clearingYieldMovement
      .textContent =
      formatBps(
        record.yield_change_bps
      );

    directionClass(
      ui.clearingYieldMovement,
      record.yield_change_bps,
      true
    );

    ui.clearingBidToCover
      .textContent =
      `${record.bid_to_cover.toFixed(
        2
      )}×`;

    ui.clearingAwardStatus
      .textContent =
      formatAward(
        record.award_status
      );

    ui.clearingSignalLight
      .className =
      `signal-light ${
        record.bid_to_cover >= 2 &&
        record.award_status ===
          "full"
          ? "signal-light--positive"
          : record.bid_to_cover <
                1 ||
              record.award_status ===
                "none"
            ? "signal-light--negative"
            : "signal-light--warning"
      }`;

    ui.pressureGaugeFill
      .style.width =
      `${Math.min(
        100,
        (
          record.bid_to_cover /
          3
        ) * 100
      )}%`;

    ui.pressureGaugeReading
      .textContent =
      `${record.bid_to_cover.toFixed(
        2
      )}×`;

    ui.selectedAuctionDate
      .textContent =
      formatDate(
        record.auction_date
      );

    ui.selectedInstrument
      .textContent =
      record.instrument_type;

    ui.selectedTenor
      .textContent =
      record.tenor;

    ui.selectedRecentCover
      .textContent =
      Number.isFinite(
        record.recent_average_cover
      )
        ? `${record.recent_average_cover.toFixed(
            2
          )}×`
        : "No prior history";

    ui.selectedRecentYield
      .textContent =
      Number.isFinite(
        record.recent_average_yield
      )
        ? formatYield(
            record.recent_average_yield
          )
        : "No prior history";

    renderSignals(record);
  }

  function renderSignals(record) {
    const signals = [
      {
        title:
          `Demand classified as ${record.demand_signal}`,

        message:
          `Submitted tenders equaled ${record.bid_to_cover.toFixed(
            2
          )} times the announced offer.`,

        className:
          demandClass(
            record.bid_to_cover
          ),
      },

      record.yield_change_bps ===
      null
        ? {
            title:
              "No prior same-tenor comparison",

            message:
              "This is the first recorded observation for this instrument and tenor.",

            className:
              "is-neutral",
          }
        : {
            title:
              Math.abs(
                record.yield_change_bps
              ) >= 20
                ? "Material yield movement"
                : "Limited yield movement",

            message:
              `The accepted yield changed by ${formatBps(
                record.yield_change_bps
              )} from the previous same-tenor auction.`,

            className:
              record.yield_change_bps <
              0
                ? "is-positive"
                : record.yield_change_bps >
                    0
                  ? "is-negative"
                  : "is-neutral",
          },

      {
        title:
          formatAward(
            record.award_status
          ),

        message:
          `${formatPercent(
            record.award_to_offer
          )} of the announced offer was awarded.`,

        className:
          record.award_status ===
          "full"
            ? "is-positive"
            : record.award_status ===
                "partial"
              ? "is-warning"
              : "is-negative",
      },
    ];

    if (
      Number.isFinite(
        record.recent_average_cover
      )
    ) {
      const difference =
        record.bid_to_cover -
        record.recent_average_cover;

      signals.push({
        title:
          difference >= 0
            ? "Demand above recent average"
            : "Demand below recent average",

        message:
          `Current cover is ${Math.abs(
            difference
          ).toFixed(2)}× ${
            difference >= 0
              ? "above"
              : "below"
          } the previous three-auction average.`,

        className:
          difference >= 0
            ? "is-positive"
            : "is-warning",
      });
    }

    ui.signalFeed.replaceChildren();

    signals.forEach(
      (signal, index) => {
        const fragment =
          ui.signalFeedItemTemplate
            .content
            .cloneNode(true);

        const item =
          fragment.querySelector(
            ".signal-feed__item"
          );

        item.classList.add(
          signal.className
        );

        item.querySelector(
          '[data-field="index"]'
        ).textContent =
          String(index + 1)
            .padStart(2, "0");

        item.querySelector(
          '[data-field="title"]'
        ).textContent =
          signal.title;

        item.querySelector(
          '[data-field="message"]'
        ).textContent =
          signal.message;

        ui.signalFeed
          .appendChild(fragment);
      }
    );
  }

  function renderLeaders() {
    const records =
      latestByTenor();

    if (!records.length) {
      [
        ui.strongestDemandTenor,
        ui.weakestDemandTenor,
        ui.largestYieldIncreaseTenor,
        ui.largestYieldDeclineTenor,
      ].forEach((element) => {
        element.textContent = "—";
      });

      return;
    }

    const strongest = [
      ...records,
    ].sort(
      (first, second) =>
        second.bid_to_cover -
        first.bid_to_cover
    )[0];

    const weakest = [
      ...records,
    ].sort(
      (first, second) =>
        first.bid_to_cover -
        second.bid_to_cover
    )[0];

    const increases =
      records.filter(
        (record) =>
          Number.isFinite(
            record.yield_change_bps
          ) &&
          record.yield_change_bps >
            0
      );

    const declines =
      records.filter(
        (record) =>
          Number.isFinite(
            record.yield_change_bps
          ) &&
          record.yield_change_bps <
            0
      );

    const increase = [
      ...increases,
    ].sort(
      (first, second) =>
        second.yield_change_bps -
        first.yield_change_bps
    )[0];

    const decline = [
      ...declines,
    ].sort(
      (first, second) =>
        first.yield_change_bps -
        second.yield_change_bps
    )[0];

    ui.strongestDemandTenor
      .textContent =
      `${strongest.tenor} · ${strongest.bid_to_cover.toFixed(
        2
      )}×`;

    ui.weakestDemandTenor
      .textContent =
      `${weakest.tenor} · ${weakest.bid_to_cover.toFixed(
        2
      )}×`;

    ui.largestYieldIncreaseTenor
      .textContent =
      increase
        ? `${increase.tenor} · ${formatBps(
            increase.yield_change_bps
          )}`
        : "—";

    ui.largestYieldDeclineTenor
      .textContent =
      decline
        ? `${decline.tenor} · ${formatBps(
            decline.yield_change_bps
          )}`
        : "—";
  }

  function renderMatrix() {
    const records =
      latestByTenor().sort(
        (first, second) =>
          first.tenor_days -
          second.tenor_days
      );

    ui.tenorMatrix
      .replaceChildren();

    if (!records.length) {
      const card =
        document.createElement(
          "article"
        );

      card.className =
        "tenor-card tenor-card--empty";

      card.innerHTML =
        '<span class="tenor-card__code">—</span>' +
        "<strong>No tenor data</strong>" +
        "<p>Load a dataset to generate the maturity map.</p>";

      ui.tenorMatrix
        .appendChild(card);

      ui.matrixSummary
        .textContent =
        "No tenors available";

      return;
    }

    records.forEach((record) => {
      const fragment =
        ui.tenorCardTemplate
          .content
          .cloneNode(true);

      const card =
        fragment.querySelector(
          ".tenor-card"
        );

      card.classList.add(
        tenorCardClass(
          record.bid_to_cover
        )
      );

      card.querySelector(
        '[data-field="tenor"]'
      ).textContent =
        record.tenor;

      card.querySelector(
        '[data-field="signal"]'
      ).textContent =
        record.demand_signal
          .toUpperCase();

      card.querySelector(
        '[data-field="yield"]'
      ).textContent =
        formatYield(
          record.accepted_yield
        );

      card.querySelector(
        '[data-field="shift"]'
      ).textContent =
        formatBps(
          record.yield_change_bps
        );

      card.querySelector(
        '[data-field="cover"]'
      ).textContent =
        `${record.bid_to_cover.toFixed(
          2
        )}×`;

      card.querySelector(
        '[data-field="award"]'
      ).textContent =
        formatAward(
          record.award_status
        );

      card.tabIndex = 0;
      card.setAttribute(
        "role",
        "button"
      );

      card.addEventListener(
        "click",
        () => {
          selectRecord(record.id);
        }
      );

      card.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            selectRecord(record.id);
          }
        }
      );

      ui.tenorMatrix
        .appendChild(fragment);
    });

    ui.matrixSummary.textContent =
      `${records.length} latest tenor observation${
        records.length === 1
          ? ""
          : "s"
      }`;
  }

  function renderTable() {
    const records =
      visibleTableRecords();

    ui.auctionTableBody
      .replaceChildren();

    if (!records.length) {
      const row =
        document.createElement("tr");

      row.className =
        "table-empty-row";

      const cell =
        document.createElement("td");

      cell.colSpan = 13;

      cell.textContent =
        state.records.length
          ? "No records match the current view."
          : "No auction records loaded.";

      row.appendChild(cell);

      ui.auctionTableBody
        .appendChild(row);
    } else {
      records.forEach((record) => {
        ui.auctionTableBody
          .appendChild(
            tableRow(record)
          );
      });
    }

    ui.visibleRecordCount
      .textContent =
      `${records.length} record${
        records.length === 1
          ? ""
          : "s"
      } displayed`;

    ui.tableSortSummary
      .textContent =
      `Sorted by ${state.sortKey.replace(
        /_/g,
        " "
      )} (${state.sortDirection})`;

    ui.tableSortButtons.forEach(
      (button) => {
        button.classList.toggle(
          "is-active",
          button.dataset.sortKey ===
            state.sortKey
        );
      }
    );
  }

  function visibleTableRecords() {
    const records =
      state.filtered.filter(
        (record) => {
          if (!state.search) {
            return true;
          }

          return [
            record.auction_date,
            record.instrument_type,
            record.tenor,
            record.award_status,
            record.demand_signal,
          ]
            .join(" ")
            .toLowerCase()
            .includes(state.search);
        }
      );

    return records.sort(
      (first, second) => {
        const firstValue =
          first[state.sortKey];

        const secondValue =
          second[state.sortKey];

        let result;

        if (
          typeof firstValue ===
            "string" &&
          typeof secondValue ===
            "string"
        ) {
          result =
            firstValue.localeCompare(
              secondValue
            );
        } else {
          const normalizedFirst =
            Number.isFinite(firstValue)
              ? firstValue
              : Number.NEGATIVE_INFINITY;

          const normalizedSecond =
            Number.isFinite(secondValue)
              ? secondValue
              : Number.NEGATIVE_INFINITY;

          result =
            normalizedFirst -
            normalizedSecond;
        }

        return state.sortDirection ===
          "asc"
          ? result
          : -result;
      }
    );
  }

  function tableRow(record) {
    const row =
      document.createElement("tr");

    row.dataset.recordId =
      record.id;

    const values = [
      formatDate(
        record.auction_date
      ),

      record.instrument_type,

      record.tenor,

      formatAmount(
        record.amount_offered
      ),

      formatAmount(
        record.tenders_received
      ),

      formatAmount(
        record.amount_awarded
      ),

      formatYield(
        record.accepted_yield
      ),

      formatBps(
        record.yield_change_bps
      ),

      `${record.bid_to_cover.toFixed(
        2
      )}×`,

      formatPercent(
        record.award_to_offer
      ),

      formatPercent(
        record.acceptance_ratio
      ),
    ];

    values.forEach(
      (value, index) => {
        const cell =
          document.createElement("td");

        cell.textContent = value;

        if (index === 7) {
          directionClass(
            cell,
            record.yield_change_bps,
            true
          );
        }

        row.appendChild(cell);
      }
    );

    row.appendChild(
      chipCell(
        formatAward(
          record.award_status
        ),

        record.award_status ===
        "full"
          ? "is-positive"
          : record.award_status ===
              "partial"
            ? "is-warning"
            : "is-negative"
      )
    );

    row.appendChild(
      chipCell(
        record.demand_signal,
        demandClass(
          record.bid_to_cover
        )
      )
    );

    return row;
  }

  function chipCell(
    text,
    className
  ) {
    const cell =
      document.createElement("td");

    const chip =
      document.createElement("span");

    chip.className =
      `table-status-chip ${className}`;

    chip.textContent = text;

    cell.appendChild(chip);

    return cell;
  }

  function renderChartPlaceholder() {
    const heading =
      ui.chartEmptyState.querySelector(
        "strong"
      );

    const paragraph =
      ui.chartEmptyState.querySelector(
        "p"
      );

    heading.textContent =
      state.filtered.length
        ? "Series data prepared"
        : "Awaiting auction data";

    paragraph.textContent =
      state.filtered.length
        ? "The processed auction series is ready. Interactive chart rendering is added in Pass 4."
        : "Upload a CSV, paste a dataset, enter an auction manually, or load the illustrative sample.";
  }

  function renderNoSelection() {
    [
      ui.overviewCoverRatio,
      ui.overviewAcceptedYield,
      ui.overviewYieldShift,
      ui.flowAmountOffered,
      ui.flowTendersReceived,
      ui.flowAmountAwarded,
      ui.flowBidToCover,
      ui.flowAwardToOffer,
      ui.flowAcceptanceRatio,
      ui.flowClearingStatus,
      ui.clearingAcceptedYield,
      ui.clearingYieldMovement,
      ui.clearingBidToCover,
      ui.clearingAwardStatus,
      ui.pressureGaugeReading,
      ui.selectedAuctionDate,
      ui.selectedInstrument,
      ui.selectedTenor,
      ui.selectedRecentCover,
      ui.selectedRecentYield,
    ].forEach((element) => {
      element.textContent = "—";
    });

    ui.flowAmountOfferedBar
      .style.width = "0";

    ui.flowTendersReceivedBar
      .style.width = "0";

    ui.flowAmountAwardedBar
      .style.width = "0";

    ui.pressureGaugeFill
      .style.width = "0";

    ui.clearingDemandSignal
      .textContent =
      "NO SIGNAL";

    ui.clearingSignalLight
      .className =
      "signal-light signal-light--idle";

    ui.signalFeed.innerHTML =
      '<article class="signal-feed__empty">' +
      "<span>00</span>" +
      "<p>Signals will appear after the dataset is validated and processed.</p>" +
      "</article>";
  }

  function resetDashboard(
    showMessage
  ) {
    state.records = [];
    state.filtered = [];
    state.selectedId = null;
    state.source = "";
    state.search = "";
    state.tapeIndex = 0;
    state.sortKey =
      "auction_date";
    state.sortDirection =
      "desc";

    clearFilterInputs();
    setInputsEnabled(false);
    renderAll();

    if (showMessage) {
      toast(
        "Dashboard reset.",
        "success"
      );
    }
  }

  function updateControls() {
    const hasData =
      state.records.length > 0;

    [
      ui.applyFiltersButton,
      ui.clearFiltersButton,
      ui.clearCurrentDatasetButton,
      ui.resetDashboardButton,
      ui.auctionTableSearch,
      ui.auctionFlowRecordSelect,
      ...ui.tableSortButtons,
    ].forEach((element) => {
      element.disabled = !hasData;
    });

    /*
      Pass 4 activates these controls.
    */
    ui.chartButtons.forEach(
      (button) => {
        button.disabled = true;
      }
    );

    /*
      Pass 5 activates save/export controls.
    */
    ui.saveDatasetButton.disabled =
      true;

    ui.exportDataButton.disabled =
      true;

    ui.exportProcessedCsvButton
      .disabled = true;

    ui.downloadVisibleTableButton
      .disabled = true;
  }

  function setInputsEnabled(
    enabled
  ) {
    [
      ui.instrumentFilter,
      ui.tenorFilter,
      ui.awardStatusFilter,
      ui.startDateFilter,
      ui.endDateFilter,
    ].forEach((element) => {
      element.disabled = !enabled;
    });
  }

  function changeSort(key) {
    if (state.sortKey === key) {
      state.sortDirection =
        state.sortDirection ===
        "asc"
          ? "desc"
          : "asc";
    } else {
      state.sortKey = key;

      state.sortDirection =
        key === "auction_date"
          ? "desc"
          : "asc";
    }

    renderTable();
  }

  function selectTableRow(event) {
    const row = event.target.closest(
      "tr[data-record-id]"
    );

    if (row) {
      selectRecord(
        row.dataset.recordId
      );
    }
  }

  function selectRecord(id) {
    state.selectedId = id;

    ui.auctionFlowRecordSelect
      .value = id;

    renderSelected();
  }

  function selected() {
    return (
      state.filtered.find(
        (record) =>
          record.id ===
          state.selectedId
      ) ||
      latest(state.filtered)
    );
  }

  function latest(records) {
    return (
      [...records].sort(
        (first, second) =>
          second.auction_date
            .localeCompare(
              first.auction_date
            ) ||
          second.tenor_days -
            first.tenor_days
      )[0] || null
    );
  }

  function latestByTenor() {
    const map = new Map();

    [...state.filtered]
      .sort(
        (first, second) =>
          first.auction_date
            .localeCompare(
              second.auction_date
            )
      )
      .forEach((record) => {
        map.set(
          `${record.instrument_type}|${record.tenor_days}`,
          record
        );
      });

    return [...map.values()];
  }

  function downloadTemplate() {
    const content =
      `${REQUIRED.join(",")}\n` +
      "2026-07-13,T-Bill,91-day,91,7000,16320,7000,5.712\n";

    const url =
      URL.createObjectURL(
        new Blob(
          [content],
          {
            type:
              "text/csv;charset=utf-8",
          }
        )
      );

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "clearing-point-template.csv";

    document.body
      .appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    toast(
      "CSV template downloaded.",
      "success"
    );
  }

  function confirmAction(
    title,
    message,
    action
  ) {
    state.confirmationAction =
      action;

    ui.confirmationTitle
      .textContent = title;

    ui.confirmationMessage
      .textContent = message;

    openDialog(
      ui.confirmationDialog
    );
  }

  function closeConfirmation() {
    state.confirmationAction =
      null;

    ui.confirmationDialog.close();
  }

  function runConfirmation() {
    const action =
      state.confirmationAction;

    closeConfirmation();

    if (
      typeof action === "function"
    ) {
      action();
    }
  }

  function toggleDataDock() {
    if (
      matchMedia(
        "(max-width: 860px)"
      ).matches
    ) {
      setDataDockOpen(
        !ui.dataDock.classList
          .contains("is-open")
      );

      return;
    }

    ui.dataDock.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function setDataDockOpen(open) {
    ui.dataDock.classList.toggle(
      "is-open",
      open
    );

    ui.toggleDataDockButton
      .setAttribute(
        "aria-expanded",
        String(open)
      );
  }

  function openDialog(dialog) {
    if (
      typeof dialog.showModal ===
      "function"
    ) {
      dialog.showModal();
    } else {
      dialog.setAttribute(
        "open",
        ""
      );
    }
  }

  function validation(
    element,
    message,
    type
  ) {
    element.textContent = message;

    element.className =
      `validation-message is-${type}`;
  }

  function clearValidation(element) {
    element.textContent = "";

    element.className =
      "validation-message";
  }

  function toast(
    message,
    type = "neutral"
  ) {
    const item =
      document.createElement("div");

    item.className =
      `toast${
        type === "neutral"
          ? ""
          : ` is-${type}`
      }`;

    item.textContent = message;

    ui.toastRegion
      .appendChild(item);

    setTimeout(() => {
      item.classList.add(
        "is-leaving"
      );

      setTimeout(
        () => item.remove(),
        240
      );
    }, 3200);
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
      }
    ).format(
      new Date(
        `${value}T00:00:00Z`
      )
    );
  }

  function formatAmount(value) {
    return new Intl.NumberFormat(
      "en-PH",
      {
        maximumFractionDigits: 2,
      }
    ).format(value);
  }

  function formatYield(value) {
    return Number.isFinite(value)
      ? `${value.toFixed(3)}%`
      : "—";
  }

  function formatBps(value) {
    return Number.isFinite(value)
      ? `${
          value > 0 ? "+" : ""
        }${value.toFixed(1)} bps`
      : "—";
  }

  function formatPercent(value) {
    return Number.isFinite(value)
      ? `${value.toFixed(1)}%`
      : "—";
  }

  function formatAward(status) {
    if (status === "full") {
      return "FULL AWARD";
    }

    if (status === "partial") {
      return "PARTIAL AWARD";
    }

    return "NO AWARD";
  }

  function demandClass(cover) {
    if (cover < 1) {
      return "is-negative";
    }

    if (cover < 2) {
      return "is-warning";
    }

    return "is-positive";
  }

  function tenorCardClass(cover) {
    if (cover < 1) {
      return "is-undersubscribed";
    }

    if (cover < 1.25) {
      return "is-thin";
    }

    if (cover < 2) {
      return "is-moderate";
    }

    return "is-strong";
  }

  function semanticClass(
    element,
    className
  ) {
    element.classList.remove(
      "is-positive",
      "is-warning",
      "is-negative",
      "is-neutral"
    );

    element.classList.add(
      className
    );
  }

  function directionClass(
    element,
    value,
    lowerIsPositive
  ) {
    if (
      !Number.isFinite(value) ||
      value === 0
    ) {
      semanticClass(
        element,
        "is-neutral"
      );

      return;
    }

    const isPositive =
      lowerIsPositive
        ? value < 0
        : value > 0;

    semanticClass(
      element,
      isPositive
        ? "is-positive"
        : "is-negative"
    );
  }
});
