"use strict";

/*
  ============================================================
  FISCAL//COMMAND
  Debt Dynamics Lab — Core Model Engine
  ============================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  const SVG_NS = "http://www.w3.org/2000/svg";

const STORAGE_KEYS = Object.freeze({
  scenarios: "fiscalCommand.savedScenarios.v1",
  contrast: "fiscalCommand.highContrast.v1",
});

const state = {
  results: null,
  activeScenario: "baseline",
  activeMeasure: "debt",
  savedScenarios: [],
};
  
  const scenarioOrder = ["favorable", "baseline", "adverse"];

  const scenarioMeta = {
    favorable: {
      label: "Favorable",
      color: "#22c55e",
    },
    baseline: {
      label: "Baseline",
      color: "#38bdf8",
    },
    adverse: {
      label: "Adverse",
      color: "#ef4444",
    },
  };

  const elements = {
    form: document.getElementById("model-form"),

    runButton: document.getElementById("run-model-button"),
    restoreButton: document.getElementById("restore-defaults-button"),
    resetButton: document.getElementById("reset-model-button"),

    saveButton: document.getElementById("save-scenario-button"),
    loadButton: document.getElementById("load-scenario-button"),
    exportButton: document.getElementById("export-csv-button"),
    printButton: document.getElementById("print-report-button"),

    contrastButton: document.getElementById("contrast-toggle"),

    growthComponentFields: document.getElementById(
      "growth-components-fields"
    ),
    directGrowthField: document.getElementById(
      "direct-nominal-growth-field"
    ),
    directGrowthInput: document.getElementById(
      "direct-nominal-growth"
    ),
    calculatedNominalGrowth: document.getElementById(
      "calculated-nominal-growth"
    ),

    validationSummary: document.getElementById("validation-summary"),
    validationErrors: document.getElementById("validation-errors"),

    chartMeasure: document.getElementById("chart-measure"),
    chartPlaceholder: document.getElementById("chart-placeholder"),
    chartTooltip: document.getElementById("chart-tooltip"),

    chartGrid: document.getElementById("chart-grid"),
    chartXAxis: document.getElementById("chart-x-axis"),
    chartYAxis: document.getElementById("chart-y-axis"),
    chartMarkers: document.getElementById("chart-data-markers"),
    chartAnnotations: document.getElementById("chart-annotations"),
    chartDescription: document.getElementById(
      "debt-chart-description"
    ),

    targetLineGroup: document.getElementById("target-line-group"),
    targetLine: document.getElementById("target-line"),
    targetLineLabel: document.getElementById("target-line-label"),

    favorableLine: document.getElementById("favorable-line-path"),
    baselineLine: document.getElementById("baseline-line-path"),
    adverseLine: document.getElementById("adverse-line-path"),

    favorableArea: document.getElementById("favorable-area-path"),
    baselineArea: document.getElementById("baseline-area-path"),
    adverseArea: document.getElementById("adverse-area-path"),

    tableScenario: document.getElementById("table-scenario"),
    tableBody: document.getElementById("projection-table-body"),

    scenariosDialog: document.getElementById(
      "saved-scenarios-dialog"
    ),
    closeScenariosDialog: document.getElementById(
  "close-scenarios-dialog"
),

savedScenariosList: document.getElementById(
  "saved-scenarios-list"
),

announcer: document.getElementById("model-announcer"),
  };

  initialize();

  /*
    ============================================================
    INITIALIZATION
    ============================================================
  */

  function initialize() {
  state.savedScenarios = loadSavedScenariosFromStorage();

  restoreContrastPreference();
  bindEvents();
  syncGrowthMode();
  updateCalculatedNominalGrowth();
  renderSavedScenarios();

  // Run the default model immediately so the dashboard is populated.
  runModel();
}

  function bindEvents() {
    elements.runButton.addEventListener("click", runModel);

    elements.form.addEventListener("input", handleFormInput);
    elements.form.addEventListener("change", handleFormInput);

    elements.form.addEventListener("reset", () => {
      window.setTimeout(() => {
        syncGrowthMode();
        updateCalculatedNominalGrowth();
        runModel();
      }, 0);
    });

    elements.resetButton.addEventListener("click", () => {
      elements.form.reset();
    });

    elements.restoreButton.addEventListener("click", () => {
      window.setTimeout(() => {
        syncGrowthMode();
        updateCalculatedNominalGrowth();
        runModel();
      }, 0);
    });

    document
      .querySelectorAll('input[name="growthMode"]')
      .forEach((radio) => {
        radio.addEventListener("change", () => {
          syncGrowthMode();
          updateCalculatedNominalGrowth();
          markModelDirty();
        });
      });

    document.querySelectorAll(".scenario-tab").forEach((button) => {
      button.addEventListener("click", () => {
        selectScenario(button.dataset.scenario);
      });
    });

    elements.chartMeasure.addEventListener("change", () => {
      state.activeMeasure = elements.chartMeasure.value;
      renderChart();
    });

    elements.tableScenario.addEventListener("change", () => {
      renderProjectionTable(elements.tableScenario.value);
    });

    elements.contrastButton.addEventListener("click", () => {
  const enabled = !document.body.classList.contains(
    "high-contrast"
  );

  setContrastMode(enabled, true);

  announce(
    enabled
      ? "High-contrast mode enabled."
      : "High-contrast mode disabled."
  );
});

    elements.printButton.addEventListener("click", () => {
      window.print();
    });

    elements.exportButton.addEventListener("click", exportSelectedCSV);

    elements.saveButton.addEventListener("click", saveCurrentScenario);

elements.loadButton.addEventListener("click", () => {
  renderSavedScenarios();

  if (
    elements.scenariosDialog &&
    typeof elements.scenariosDialog.showModal === "function"
  ) {
    elements.scenariosDialog.showModal();
  }
});

    elements.closeScenariosDialog.addEventListener("click", () => {
      elements.scenariosDialog.close();
    });

    elements.scenariosDialog.addEventListener("click", (event) => {
      if (event.target === elements.scenariosDialog) {
        elements.scenariosDialog.close();
      }
    });
  }

  function handleFormInput() {
    syncGrowthMode();
    updateCalculatedNominalGrowth();
    markModelDirty();
  }

  function syncGrowthMode() {
    const mode = getGrowthMode();
    const useComponents = mode === "components";

    elements.growthComponentFields.hidden = !useComponents;
    elements.directGrowthField.hidden = useComponents;
    elements.directGrowthInput.disabled = useComponents;
  }

  function updateCalculatedNominalGrowth() {
    const mode = getGrowthMode();

    let nominalGrowth;

    if (mode === "direct") {
      nominalGrowth = readNumber("direct-nominal-growth");
    } else {
      const realGrowth = readNumber("real-growth") / 100;
      const inflation = readNumber("inflation-rate") / 100;

      nominalGrowth =
        ((1 + realGrowth) * (1 + inflation) - 1) * 100;
    }

    elements.calculatedNominalGrowth.textContent =
      formatPercent(nominalGrowth, 2);
  }

  function markModelDirty() {
    if (!state.results) {
      return;
    }

    setText("header-model-status", "Inputs changed");
    setStatusDot("amber");
  }

  /*
    ============================================================
    INPUT COLLECTION AND VALIDATION
    ============================================================
  */

  function getGrowthMode() {
    const selected = document.querySelector(
      'input[name="growthMode"]:checked'
    );

    return selected ? selected.value : "components";
  }

  function readNumber(id) {
    const input = document.getElementById(id);

    if (!input) {
      return Number.NaN;
    }

    return Number.parseFloat(input.value);
  }

  function collectInputs() {
    const growthMode = getGrowthMode();

    const realGrowth = readNumber("real-growth");
    const inflation = readNumber("inflation-rate");
    const directNominalGrowth = readNumber(
      "direct-nominal-growth"
    );

    const nominalGrowth =
      growthMode === "direct"
        ? directNominalGrowth
        : ((1 + realGrowth / 100) *
              (1 + inflation / 100) -
            1) *
          100;

    return {
      baseYear: Math.round(readNumber("base-year")),
      projectionHorizon: Math.round(
        readNumber("projection-horizon")
      ),

      startingDebt: readNumber("starting-debt"),
      targetDebt: readNumber("target-debt"),

      growthMode,
      realGrowth,
      inflation,
      directNominalGrowth,
      nominalGrowth,

      effectiveInterestRate: readNumber(
        "effective-interest-rate"
      ),
      primaryBalance: readNumber("primary-balance"),
      revenueRatio: readNumber("revenue-ratio"),
      annualStockFlow: readNumber("annual-stock-flow"),

      favorableGrowthAdjustment: readNumber(
        "favorable-growth-adjustment"
      ),
      favorableRateAdjustment: readNumber(
        "favorable-rate-adjustment"
      ),
      favorablePrimaryAdjustment: readNumber(
        "favorable-primary-adjustment"
      ),

      adverseGrowthShock: readNumber(
        "adverse-growth-shock"
      ),
      adverseRateShock: readNumber("adverse-rate-shock"),
      adversePrimaryShock: readNumber(
        "adverse-primary-shock"
      ),
      adverseStockFlowShock: readNumber(
        "adverse-stock-flow-shock"
      ),

      shockStartYear: Math.round(
        readNumber("shock-start-year")
      ),
      shockDuration: Math.round(readNumber("shock-duration")),

      foreignCurrencyShare: readNumber(
        "foreign-currency-share"
      ),
      depreciationShock: readNumber("depreciation-shock"),
    };
  }

  function validateInputs(inputs) {
    const errors = [];

    Object.entries(inputs).forEach(([key, value]) => {
      if (
        key !== "growthMode" &&
        !Number.isFinite(value)
      ) {
        errors.push(`A valid number is required for ${key}.`);
      }
    });

    if (inputs.baseYear < 1900 || inputs.baseYear > 2200) {
      errors.push("Base year must be between 1900 and 2200.");
    }

    if (
      inputs.projectionHorizon < 5 ||
      inputs.projectionHorizon > 20
    ) {
      errors.push(
        "Projection horizon must be between 5 and 20 years."
      );
    }

    if (inputs.startingDebt < 0) {
      errors.push("Starting debt cannot be negative.");
    }

    if (inputs.targetDebt < 0) {
      errors.push("Target debt cannot be negative.");
    }

    if (inputs.revenueRatio <= 0) {
      errors.push(
        "Government revenue must be greater than zero."
      );
    }

    if (inputs.foreignCurrencyShare < 0 ||
        inputs.foreignCurrencyShare > 100) {
      errors.push(
        "Foreign-currency debt share must be between 0% and 100%."
      );
    }

    if (
      inputs.shockStartYear < 1 ||
      inputs.shockStartYear > inputs.projectionHorizon
    ) {
      errors.push(
        "Shock start year must fall within the projection horizon."
      );
    }

    if (
      inputs.shockDuration < 1 ||
      inputs.shockDuration > inputs.projectionHorizon
    ) {
      errors.push(
        "Shock duration must be between 1 year and the projection horizon."
      );
    }

    const favorableGrowth =
      inputs.nominalGrowth +
      inputs.favorableGrowthAdjustment;

    const adverseGrowth =
      inputs.nominalGrowth + inputs.adverseGrowthShock;

    if (inputs.nominalGrowth <= -99.9) {
      errors.push(
        "Baseline nominal growth must remain above -100%."
      );
    }

    if (favorableGrowth <= -99.9) {
      errors.push(
        "Favorable nominal growth must remain above -100%."
      );
    }

    if (adverseGrowth <= -99.9) {
      errors.push(
        "Adverse nominal growth must remain above -100%."
      );
    }

    return errors;
  }

  function showValidationErrors(errors) {
    elements.validationErrors.replaceChildren();

    errors.forEach((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      elements.validationErrors.appendChild(item);
    });

    elements.validationSummary.hidden = false;
    elements.validationSummary.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });

    announce(
      `Model not run. ${errors.length} validation issue${
        errors.length === 1 ? "" : "s"
      } found.`
    );
  }

  function hideValidationErrors() {
    elements.validationSummary.hidden = true;
    elements.validationErrors.replaceChildren();
  }

  /*
    ============================================================
    MODEL ENGINE
    ============================================================
  */

  function runModel() {
    const inputs = collectInputs();
    const errors = validateInputs(inputs);

    if (errors.length > 0) {
      showValidationErrors(errors);
      setText("header-model-status", "Input error");
      setStatusDot("red");
      return false;
    }

    hideValidationErrors();

    const configs = createScenarioConfigs(inputs);
    const scenarios = {};

    scenarioOrder.forEach((scenarioKey) => {
      const config = configs[scenarioKey];
      const rows = projectScenario(inputs, config);

      scenarios[scenarioKey] = {
        config,
        rows,
        summary: summarizeScenario(inputs, config, rows),
      };
    });

    state.results = {
      inputs,
      scenarios,
      generatedAt: new Date(),
    };

    elements.chartPlaceholder.hidden = true;

    updateCalculatedNominalGrowth();
    renderAll();

    announce(
      `Model complete. Baseline ending debt is ${formatPercent(
        scenarios.baseline.summary.finalDebt,
        1
      )}.`
    );
    return true;
  }

  function createScenarioConfigs(inputs) {
    return {
      baseline: {
        key: "baseline",
        label: "Baseline",

        nominalGrowth: inputs.nominalGrowth,
        effectiveInterestRate:
          inputs.effectiveInterestRate,
        primaryBalance: inputs.primaryBalance,

        annualStockFlow: inputs.annualStockFlow,

        growthShock: 0,
        rateShock: 0,
        primaryShock: 0,
        oneTimeStockFlowShock: 0,

        shockStartYear: inputs.shockStartYear,
        shockDuration: inputs.shockDuration,

        foreignCurrencyShare: 0,
        depreciationShock: 0,
      },

      favorable: {
        key: "favorable",
        label: "Favorable",

        nominalGrowth:
          inputs.nominalGrowth +
          inputs.favorableGrowthAdjustment,

        effectiveInterestRate:
          inputs.effectiveInterestRate +
          inputs.favorableRateAdjustment,

        primaryBalance:
          inputs.primaryBalance +
          inputs.favorablePrimaryAdjustment,

        annualStockFlow: inputs.annualStockFlow,

        growthShock: 0,
        rateShock: 0,
        primaryShock: 0,
        oneTimeStockFlowShock: 0,

        shockStartYear: inputs.shockStartYear,
        shockDuration: inputs.shockDuration,

        foreignCurrencyShare: 0,
        depreciationShock: 0,
      },

      adverse: {
        key: "adverse",
        label: "Adverse",

        nominalGrowth: inputs.nominalGrowth,
        effectiveInterestRate:
          inputs.effectiveInterestRate,
        primaryBalance: inputs.primaryBalance,

        annualStockFlow: inputs.annualStockFlow,

        growthShock: inputs.adverseGrowthShock,
        rateShock: inputs.adverseRateShock,
        primaryShock: inputs.adversePrimaryShock,
        oneTimeStockFlowShock:
          inputs.adverseStockFlowShock,

        shockStartYear: inputs.shockStartYear,
        shockDuration: inputs.shockDuration,

        foreignCurrencyShare:
          inputs.foreignCurrencyShare,
        depreciationShock: inputs.depreciationShock,
      },
    };
  }

  function projectScenario(
    inputs,
    config,
    constantPrimaryBalance = null
  ) {
    const rows = [];
    let openingDebt = inputs.startingDebt;

    for (
      let projectionYear = 1;
      projectionYear <= inputs.projectionHorizon;
      projectionYear += 1
    ) {
      const insideShockWindow =
        config.key === "adverse" &&
        projectionYear >= config.shockStartYear &&
        projectionYear <
          config.shockStartYear + config.shockDuration;

      let nominalGrowth = config.nominalGrowth;
      let effectiveRate = config.effectiveInterestRate;
      let primaryBalance =
        constantPrimaryBalance === null
          ? config.primaryBalance
          : constantPrimaryBalance;

      let stockFlowAdjustment = config.annualStockFlow;

      if (insideShockWindow) {
        nominalGrowth += config.growthShock;
        effectiveRate += config.rateShock;

        if (constantPrimaryBalance === null) {
          primaryBalance += config.primaryShock;
        }
      }

      if (
        config.key === "adverse" &&
        projectionYear === config.shockStartYear
      ) {
        stockFlowAdjustment += config.oneTimeStockFlowShock;

        const currencyValuationEffect =
          openingDebt *
          (config.foreignCurrencyShare / 100) *
          (config.depreciationShock / 100);

        stockFlowAdjustment += currencyValuationEffect;
      }

      const nominalGrowthDecimal = nominalGrowth / 100;
      const effectiveRateDecimal = effectiveRate / 100;

      const debtDynamicsFactor =
        (1 + effectiveRateDecimal) /
        (1 + nominalGrowthDecimal);

      const interestExpenseGDP =
        effectiveRateDecimal * openingDebt;

      const interestRevenue =
        (interestExpenseGDP / inputs.revenueRatio) * 100;

      const closingDebt =
        debtDynamicsFactor * openingDebt -
        primaryBalance +
        stockFlowAdjustment;

      rows.push({
        projectionYear,
        year: inputs.baseYear + projectionYear,

        openingDebt,
        nominalGrowth,
        effectiveRate,
        primaryBalance,
        stockFlowAdjustment,

        interestExpenseGDP,
        interestRevenue,

        closingDebt,
      });

      openingDebt = closingDebt;
    }

    return rows;
  }

  function summarizeScenario(inputs, config, rows) {
    const finalRow = rows[rows.length - 1];
    const firstRow = rows[0];

    const finalDebt = finalRow.closingDebt;

    const peakDebt = Math.max(
      inputs.startingDebt,
      ...rows.map((row) => row.closingDebt)
    );

    const debtChange = finalDebt - inputs.startingDebt;

    const stabilizingPrimaryBalance =
      calculateStabilizingPrimaryBalance(
        inputs.startingDebt,
        firstRow.effectiveRate,
        firstRow.nominalGrowth,
        config.annualStockFlow
      );

    const primaryBalanceGap =
      firstRow.primaryBalance -
      stabilizingPrimaryBalance;

    const targetPrimaryBalance =
      calculateTargetPrimaryBalance(inputs, config);

    const trajectory = classifyTrajectory(debtChange);

    return {
      finalDebt,
      peakDebt,
      debtChange,

      stabilizingPrimaryBalance,
      primaryBalanceGap,
      targetPrimaryBalance,

      interestExpenseGDP: finalRow.interestExpenseGDP,
      interestRevenue: finalRow.interestRevenue,

      trajectory,
      trajectoryDescription: describeTrajectory(
        trajectory,
        debtChange
      ),
    };
  }

  function calculateStabilizingPrimaryBalance(
    debtRatio,
    effectiveRate,
    nominalGrowth,
    recurringStockFlow
  ) {
    const rateDecimal = effectiveRate / 100;
    const growthDecimal = nominalGrowth / 100;

    return (
      ((rateDecimal - growthDecimal) /
        (1 + growthDecimal)) *
        debtRatio +
      recurringStockFlow
    );
  }

  function calculateTargetPrimaryBalance(inputs, config) {
    /*
      Binary search for a constant primary balance that reaches
      the selected target while preserving the scenario's growth,
      interest-rate, and stock-flow assumptions.
    */

    let lowerBound = -100;
    let upperBound = 100;

    const lowerDebt =
      projectScenario(inputs, config, lowerBound)
        .slice(-1)[0]
        .closingDebt;

    const upperDebt =
      projectScenario(inputs, config, upperBound)
        .slice(-1)[0]
        .closingDebt;

    if (
      inputs.targetDebt > lowerDebt ||
      inputs.targetDebt < upperDebt
    ) {
      return Number.NaN;
    }

    for (let iteration = 0; iteration < 120; iteration += 1) {
      const midpoint = (lowerBound + upperBound) / 2;

      const projectedDebt =
        projectScenario(inputs, config, midpoint)
          .slice(-1)[0]
          .closingDebt;

      if (projectedDebt > inputs.targetDebt) {
        lowerBound = midpoint;
      } else {
        upperBound = midpoint;
      }
    }

    return (lowerBound + upperBound) / 2;
  }

  function classifyTrajectory(debtChange) {
    if (debtChange <= -5) {
      return "Improving";
    }

    if (debtChange <= 2) {
      return "Broadly stable";
    }

    if (debtChange <= 10) {
      return "Rising";
    }

    return "Rapidly rising";
  }

  function describeTrajectory(trajectory, debtChange) {
    const absoluteChange = Math.abs(debtChange).toFixed(1);

    if (trajectory === "Improving") {
      return `Debt declines by ${absoluteChange} percentage points over the projection.`;
    }

    if (trajectory === "Broadly stable") {
      return `Debt changes by ${debtChange.toFixed(
        1
      )} percentage points and remains broadly near its starting level.`;
    }

    if (trajectory === "Rising") {
      return `Debt increases by ${absoluteChange} percentage points over the projection.`;
    }

    return `Debt increases by ${absoluteChange} percentage points, indicating a rapidly rising mechanical path.`;
  }

  /*
    ============================================================
    RENDERING
    ============================================================
  */

  function renderAll() {
    renderScenarioTabs();
    renderTickerAndHeader();
    renderActiveMetrics();
    renderScenarioComparison();
    renderDriverAnalysis();
    renderRiskFlags();
    renderChart();
    renderProjectionTable(elements.tableScenario.value);
  }

  function selectScenario(scenarioKey) {
    if (!scenarioOrder.includes(scenarioKey)) {
      return;
    }

    state.activeScenario = scenarioKey;
    elements.tableScenario.value = scenarioKey;

    renderAll();

    announce(
      `${scenarioMeta[scenarioKey].label} scenario selected.`
    );
  }

  function renderScenarioTabs() {
    document.querySelectorAll(".scenario-tab").forEach((button) => {
      const active =
        button.dataset.scenario === state.activeScenario;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderTickerAndHeader() {
    const { inputs, scenarios } = state.results;

    const active =
      scenarios[state.activeScenario];

    const firstRow = active.rows[0];
    const summary = active.summary;

    setText(
      "ticker-starting-debt",
      formatPercent(inputs.startingDebt)
    );

    setText(
      "ticker-final-debt",
      formatPercent(summary.finalDebt)
    );

    setText(
      "ticker-nominal-growth",
      formatPercent(firstRow.nominalGrowth)
    );

    setText(
      "ticker-interest-rate",
      formatPercent(firstRow.effectiveRate)
    );

    setText(
      "ticker-primary-balance",
      formatSignedPercent(firstRow.primaryBalance)
    );

    setText("ticker-trajectory", summary.trajectory);

    setText(
      "header-model-status",
      `${active.config.label} · ${summary.trajectory}`
    );

    const statusColor =
      summary.trajectory === "Improving"
        ? "green"
        : summary.trajectory === "Broadly stable"
          ? "cyan"
          : summary.trajectory === "Rising"
            ? "amber"
            : "red";

    setStatusDot(statusColor);
  }

  function renderActiveMetrics() {
    const active =
      state.results.scenarios[state.activeScenario];

    const summary = active.summary;

    setText("trajectory-signal", summary.trajectory);
    setText(
      "trajectory-description",
      summary.trajectoryDescription
    );

    setText(
      "metric-ending-debt",
      formatNumber(summary.finalDebt)
    );

    setText(
      "metric-peak-debt",
      formatNumber(summary.peakDebt)
    );

    setText(
      "metric-debt-change",
      formatSignedNumber(summary.debtChange)
    );

    setText(
      "metric-stabilizing-primary",
      formatSignedNumber(
        summary.stabilizingPrimaryBalance
      )
    );

    setText(
      "metric-primary-gap",
      formatSignedNumber(summary.primaryBalanceGap)
    );

    setText(
      "metric-target-primary",
      formatSignedNumber(summary.targetPrimaryBalance)
    );

    setText(
      "metric-interest-gdp",
      formatNumber(summary.interestExpenseGDP)
    );

    setText(
      "metric-interest-revenue",
      formatNumber(summary.interestRevenue)
    );
  }

  function renderScenarioComparison() {
    scenarioOrder.forEach((scenarioKey) => {
      const summary =
        state.results.scenarios[scenarioKey].summary;

      setText(
        `${scenarioKey}-final-debt`,
        formatPercent(summary.finalDebt)
      );

      setText(
        `${scenarioKey}-peak-debt`,
        formatPercent(summary.peakDebt)
      );

      setText(
        `${scenarioKey}-stabilizing-primary`,
        formatSignedPercent(
          summary.stabilizingPrimaryBalance
        )
      );

      setText(
        `${scenarioKey}-interest-revenue`,
        formatPercent(summary.interestRevenue)
      );

      setText(
        `${scenarioKey}-trajectory`,
        summary.trajectory
      );
    });
  }

  function renderDriverAnalysis() {
    const active =
      state.results.scenarios[state.activeScenario];

    const rows = active.rows;
    const summary = active.summary;

    const averageGrowth = average(
      rows.map((row) => row.nominalGrowth)
    );

    const averageRate = average(
      rows.map((row) => row.effectiveRate)
    );

    const averagePrimaryBalance = average(
      rows.map((row) => row.primaryBalance)
    );

    const interestGrowthDifferential =
      averageRate - averageGrowth;

    const cumulativeStockFlow = rows.reduce(
      (total, row) => total + row.stockFlowAdjustment,
      0
    );

    setText(
      "driver-interest-growth",
      `${formatSignedNumber(
        interestGrowthDifferential
      )} pp`
    );

    setText(
      "driver-primary-position",
      `${formatSignedNumber(
        summary.primaryBalanceGap
      )} pp`
    );

    setText(
      "driver-shock-contribution",
      `${formatSignedNumber(
        cumulativeStockFlow
      )} pp`
    );

    if (interestGrowthDifferential > 0) {
      setText(
        "driver-interest-growth-note",
        "The effective interest rate exceeds nominal growth on average, placing upward pressure on debt."
      );
    } else {
      setText(
        "driver-interest-growth-note",
        "Nominal growth exceeds the effective interest rate on average, helping reduce the debt ratio mechanically."
      );
    }

    if (summary.primaryBalanceGap < 0) {
      setText(
        "driver-primary-position-note",
        "The modeled primary balance is weaker than the balance required to stabilize debt."
      );
    } else {
      setText(
        "driver-primary-position-note",
        "The modeled primary balance is at least as strong as the initial debt-stabilizing balance."
      );
    }

    if (Math.abs(cumulativeStockFlow) >= 1) {
      setText(
        "driver-shock-contribution-note",
        "Stock-flow adjustments materially affect the projected debt path."
      );
    } else {
      setText(
        "driver-shock-contribution-note",
        "Stock-flow adjustments have a limited cumulative effect in this scenario."
      );
    }

    let summaryText;

    if (
      interestGrowthDifferential > 0 &&
      summary.primaryBalanceGap < 0
    ) {
      summaryText =
        "Debt is being pushed upward by both an unfavorable interest-growth relationship and a primary balance weaker than the stabilizing requirement.";
    } else if (interestGrowthDifferential > 0) {
      summaryText =
        "The main upward pressure comes from the effective interest rate exceeding nominal GDP growth.";
    } else if (summary.primaryBalanceGap < 0) {
      summaryText =
        "Growth conditions are mechanically supportive, but the primary balance remains too weak to stabilize the modeled path.";
    } else if (Math.abs(cumulativeStockFlow) >= 1) {
      summaryText =
        "Recurring or one-time stock-flow adjustments are the largest exceptional influence on the debt path.";
    } else {
      summaryText =
        "The combined interest-growth relationship and primary balance are broadly consistent with a stable or improving debt path.";
    }

    if (averagePrimaryBalance < 0) {
      summaryText +=
        " The scenario also maintains an average primary deficit.";
    }

    setText("driver-analysis-summary", summaryText);
  }

  function renderRiskFlags() {
    const list = document.getElementById("risk-flags-list");
    const active =
      state.results.scenarios[state.activeScenario];

    const { inputs } = state.results;
    const summary = active.summary;
    const firstRow = active.rows[0];

    list.replaceChildren();

    const flags = [];

    if (firstRow.effectiveRate > firstRow.nominalGrowth) {
      flags.push({
        type: "warning",
        text:
          "The initial effective interest rate exceeds nominal GDP growth.",
      });
    }

    if (summary.primaryBalanceGap < 0) {
      flags.push({
        type: "warning",
        text: `The primary balance is ${Math.abs(
          summary.primaryBalanceGap
        ).toFixed(
          1
        )} percentage points weaker than the initial stabilizing balance.`,
      });
    }

    if (summary.finalDebt > inputs.targetDebt) {
      flags.push({
        type: "warning",
        text: `Final debt remains ${(
          summary.finalDebt - inputs.targetDebt
        ).toFixed(1)} percentage points above the selected target.`,
      });
    } else {
      flags.push({
        type: "positive",
        text: "The selected scenario reaches or moves below the debt target.",
      });
    }

    if (summary.interestRevenue >= 30) {
      flags.push({
        type: "danger",
        text:
          "Modeled final-year interest expense exceeds 30% of government revenue.",
      });
    } else if (summary.interestRevenue >= 20) {
      flags.push({
        type: "warning",
        text:
          "Modeled final-year interest expense exceeds 20% of government revenue.",
      });
    }

    if (summary.debtChange > 10) {
      flags.push({
        type: "danger",
        text:
          "Debt rises by more than 10 percentage points over the projection.",
      });
    }

    if (summary.debtChange <= -5) {
      flags.push({
        type: "positive",
        text:
          "Debt declines by at least 5 percentage points over the projection.",
      });
    }

    if (active.rows.some((row) => row.closingDebt < 0)) {
      flags.push({
        type: "warning",
        text:
          "The debt ratio falls below zero under the entered assumptions; interpret the scenario cautiously.",
      });
    }

    if (flags.length === 0) {
      flags.push({
        type: "neutral",
        text: "No material model flags were generated.",
      });
    }

    flags.forEach((flag) => {
      const item = document.createElement("li");

      item.className = `${flag.type}-flag`;
      item.textContent = flag.text;

      list.appendChild(item);
    });
  }

  /*
    ============================================================
    PROJECTION TABLE
    ============================================================
  */

  function renderProjectionTable(scenarioKey) {
    if (!state.results) {
      return;
    }

    const scenario =
      state.results.scenarios[scenarioKey] ||
      state.results.scenarios.baseline;

    elements.tableBody.replaceChildren();

    scenario.rows.forEach((row) => {
      const tableRow = document.createElement("tr");

      const values = [
        row.year,
        formatPercent(row.openingDebt),
        formatPercent(row.nominalGrowth),
        formatPercent(row.effectiveRate),
        formatSignedPercent(row.primaryBalance),
        formatSignedPercent(row.stockFlowAdjustment),
        formatPercent(row.interestExpenseGDP),
        formatPercent(row.closingDebt),
      ];

      values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        tableRow.appendChild(cell);
      });

      elements.tableBody.appendChild(tableRow);
    });
  }

  /*
    ============================================================
    SVG CHART
    ============================================================
  */

  function renderChart() {
    if (!state.results) {
      return;
    }

    const measure = elements.chartMeasure.value;
    state.activeMeasure = measure;

    const chart = {
      left: 80,
      right: 960,
      top: 40,
      bottom: 500,
      width: 880,
      height: 460,
    };

    const seriesByScenario = {};

    scenarioOrder.forEach((scenarioKey) => {
      seriesByScenario[scenarioKey] = createChartSeries(
        scenarioKey,
        measure
      );
    });

    const allValues = scenarioOrder.flatMap((scenarioKey) =>
      seriesByScenario[scenarioKey].map((point) => point.value)
    );

    if (measure === "debt") {
      allValues.push(state.results.inputs.targetDebt);
    }

    let minimum = Math.min(...allValues);
    let maximum = Math.max(...allValues);

    if (minimum === maximum) {
      minimum -= 1;
      maximum += 1;
    }

    const rawRange = maximum - minimum;
    const padding = Math.max(
      rawRange * 0.12,
      measure === "debt" ? 3 : 0.5
    );

    minimum -= padding;
    maximum += padding;

    if (minimum >= 0) {
      minimum = Math.max(0, minimum);
    }

    const pointCount =
      seriesByScenario.baseline.length;

    const xScale = (index) => {
      if (pointCount <= 1) {
        return chart.left;
      }

      return (
        chart.left +
        (index / (pointCount - 1)) * chart.width
      );
    };

    const yScale = (value) => {
      return (
        chart.bottom -
        ((value - minimum) / (maximum - minimum)) *
          chart.height
      );
    };

    renderChartAxes({
      chart,
      minimum,
      maximum,
      pointCount,
      xScale,
      yScale,
    });

    scenarioOrder.forEach((scenarioKey) => {
      const points = seriesByScenario[scenarioKey];

      const linePath = buildLinePath(
        points,
        xScale,
        yScale
      );

      const areaPath = buildAreaPath(
        points,
        xScale,
        yScale,
        chart.bottom
      );

      document
        .getElementById(`${scenarioKey}-line-path`)
        .setAttribute("d", linePath);

      document
        .getElementById(`${scenarioKey}-area-path`)
        .setAttribute("d", areaPath);
    });

    renderTargetLine(measure, yScale);
    renderChartMarkers(
      seriesByScenario[state.activeScenario],
      state.activeScenario,
      xScale,
      yScale,
      measure
    );

    const measureLabel = getMeasureLabel(measure);

    elements.chartDescription.textContent =
      `${measureLabel} projection comparing favorable, baseline, and adverse scenarios.`;

    elements.chartPlaceholder.hidden = true;
  }

  function createChartSeries(scenarioKey, measure) {
    const { inputs, scenarios } = state.results;
    const scenario = scenarios[scenarioKey];
    const firstRow = scenario.rows[0];

    const initialInterestGDP =
      (firstRow.effectiveRate / 100) *
      inputs.startingDebt;

    const initialInterestRevenue =
      (initialInterestGDP / inputs.revenueRatio) * 100;

    const initialValue =
      measure === "debt"
        ? inputs.startingDebt
        : measure === "interest-gdp"
          ? initialInterestGDP
          : initialInterestRevenue;

    return [
      {
        year: inputs.baseYear,
        value: initialValue,
      },
      ...scenario.rows.map((row) => ({
        year: row.year,
        value:
          measure === "debt"
            ? row.closingDebt
            : measure === "interest-gdp"
              ? row.interestExpenseGDP
              : row.interestRevenue,
      })),
    ];
  }

  function renderChartAxes({
    chart,
    minimum,
    maximum,
    pointCount,
    xScale,
    yScale,
  }) {
    elements.chartGrid.replaceChildren();
    elements.chartXAxis.replaceChildren();
    elements.chartYAxis.replaceChildren();

    const horizontalLines = 6;

    for (
      let index = 0;
      index <= horizontalLines;
      index += 1
    ) {
      const value =
        minimum +
        ((maximum - minimum) * index) /
          horizontalLines;

      const y = yScale(value);

      const line = createSVGElement("line", {
        x1: chart.left,
        x2: chart.right,
        y1: y,
        y2: y,
      });

      elements.chartGrid.appendChild(line);

      const label = createSVGElement("text", {
        x: chart.left - 12,
        y: y + 4,
        "text-anchor": "end",
      });

      label.textContent = value.toFixed(1);
      elements.chartYAxis.appendChild(label);
    }

    const step = Math.max(
      1,
      Math.ceil((pointCount - 1) / 8)
    );

    const baseYear = state.results.inputs.baseYear;

    for (
      let index = 0;
      index < pointCount;
      index += step
    ) {
      addXAxisEntry(index);
    }

    if ((pointCount - 1) % step !== 0) {
      addXAxisEntry(pointCount - 1);
    }

    function addXAxisEntry(index) {
      const x = xScale(index);

      const line = createSVGElement("line", {
        x1: x,
        x2: x,
        y1: chart.top,
        y2: chart.bottom,
      });

      elements.chartGrid.appendChild(line);

      const label = createSVGElement("text", {
        x,
        y: chart.bottom + 28,
        "text-anchor": "middle",
      });

      label.textContent = String(baseYear + index);
      elements.chartXAxis.appendChild(label);
    }
  }

  function renderTargetLine(measure, yScale) {
    if (measure !== "debt") {
      elements.targetLineGroup.style.display = "none";
      return;
    }

    elements.targetLineGroup.style.display = "";

    const target = state.results.inputs.targetDebt;
    const y = yScale(target);

    elements.targetLine.setAttribute("y1", y);
    elements.targetLine.setAttribute("y2", y);

    elements.targetLineLabel.setAttribute("y", y - 8);
    elements.targetLineLabel.textContent =
      `TARGET ${target.toFixed(1)}%`;
  }

  function renderChartMarkers(
    points,
    scenarioKey,
    xScale,
    yScale,
    measure
  ) {
    elements.chartMarkers.replaceChildren();
    elements.chartAnnotations.replaceChildren();

    const color = scenarioMeta[scenarioKey].color;

    points.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);

      const marker = createSVGElement("circle", {
        cx: x,
        cy: y,
        r: index === points.length - 1 ? 6 : 4,
        fill: color,
        stroke: "#050608",
        tabindex: "0",
        role: "button",
        "aria-label":
          `${point.year}: ${formatChartValue(
            point.value,
            measure
          )}`,
      });

      const title = createSVGElement("title");
      title.textContent =
        `${scenarioMeta[scenarioKey].label}, ${point.year}: ` +
        formatChartValue(point.value, measure);

      marker.appendChild(title);

      marker.addEventListener("mouseenter", () => {
        showChartTooltip({
          x,
          y,
          point,
          scenarioKey,
          measure,
        });
      });

      marker.addEventListener("mouseleave", hideChartTooltip);

      marker.addEventListener("focus", () => {
        showChartTooltip({
          x,
          y,
          point,
          scenarioKey,
          measure,
        });
      });

      marker.addEventListener("blur", hideChartTooltip);

      elements.chartMarkers.appendChild(marker);
    });

    const finalPoint = points[points.length - 1];

    const annotation = createSVGElement("text", {
      x: xScale(points.length - 1) - 8,
      y: yScale(finalPoint.value) - 15,
      "text-anchor": "end",
      fill: color,
    });

    annotation.style.fontFamily =
      '"IBM Plex Mono", monospace';

    annotation.style.fontSize = "11px";

    annotation.textContent =
      `${scenarioMeta[scenarioKey].label.toUpperCase()} ` +
      formatChartValue(finalPoint.value, measure);

    elements.chartAnnotations.appendChild(annotation);
  }

  function buildLinePath(points, xScale, yScale) {
    return points
      .map((point, index) => {
        const command = index === 0 ? "M" : "L";

        return `${command} ${xScale(index).toFixed(
          2
        )} ${yScale(point.value).toFixed(2)}`;
      })
      .join(" ");
  }

  function buildAreaPath(
    points,
    xScale,
    yScale,
    chartBottom
  ) {
    if (points.length === 0) {
      return "";
    }

    const line = buildLinePath(points, xScale, yScale);

    const lastX = xScale(points.length - 1);
    const firstX = xScale(0);

    return `${line} L ${lastX} ${chartBottom} L ${firstX} ${chartBottom} Z`;
  }

  function showChartTooltip({
    x,
    y,
    point,
    scenarioKey,
    measure,
  }) {
    const tooltip = elements.chartTooltip;

    tooltip.replaceChildren();

    const scenarioLine = document.createElement("strong");
    scenarioLine.textContent =
      scenarioMeta[scenarioKey].label;

    const detail = document.createElement("div");
    detail.textContent =
      `${point.year} · ${getMeasureLabel(measure)}: ` +
      formatChartValue(point.value, measure);

    tooltip.appendChild(scenarioLine);
    tooltip.appendChild(detail);

    tooltip.hidden = false;
    tooltip.style.left = `${x / 10}%`;
    tooltip.style.top = `${y / 5.6}%`;

    tooltip.style.transform =
      x > 780
        ? "translate(-105%, -50%)"
        : "translate(12px, -50%)";
  }

  function hideChartTooltip() {
    elements.chartTooltip.hidden = true;
  }

  function getMeasureLabel(measure) {
    if (measure === "interest-gdp") {
      return "Interest expense / GDP";
    }

    if (measure === "interest-revenue") {
      return "Interest expense / revenue";
    }

    return "Debt-to-GDP";
  }

  function formatChartValue(value, measure) {
    if (measure === "interest-revenue") {
      return `${value.toFixed(1)}% of revenue`;
    }

    return `${value.toFixed(1)}% of GDP`;
  }

  /*
  ============================================================
  SAVED SCENARIOS AND PREFERENCES
  ============================================================
*/

function saveCurrentScenario() {
  const modelSucceeded = runModel();

  if (!modelSucceeded) {
    announce("Correct the model inputs before saving.");
    return;
  }

  const inputs = collectInputs();

  const defaultName =
    `${scenarioMeta[state.activeScenario].label} ` +
    `${inputs.baseYear}–${
      inputs.baseYear + inputs.projectionHorizon
    }`;

  const requestedName = window.prompt(
    "Name this scenario:",
    defaultName
  );

  if (requestedName === null) {
    return;
  }

  const name = requestedName.trim();

  if (!name) {
    temporaryStatus("Scenario name cannot be empty");
    announce("Scenario was not saved because its name was empty.");
    return;
  }

  const now = new Date().toISOString();

  const savedScenario = {
    schemaVersion: 1,
    id: generateScenarioId(),
    name,
    createdAt: now,
    updatedAt: now,

    inputs,
    activeScenario: state.activeScenario,
    activeMeasure: elements.chartMeasure.value,
    tableScenario: elements.tableScenario.value,
  };

  state.savedScenarios.unshift(savedScenario);

  const stored = persistSavedScenarios();

  if (!stored) {
    state.savedScenarios = state.savedScenarios.filter(
      (scenario) => scenario.id !== savedScenario.id
    );

    temporaryStatus("Scenario could not be saved");
    announce(
      "Browser storage was unavailable. The scenario was not saved."
    );

    return;
  }

  renderSavedScenarios();
  temporaryStatus("Scenario saved");

  announce(`${name} was saved in this browser.`);
}

function loadSavedScenario(id) {
  const savedScenario = state.savedScenarios.find(
    (scenario) => scenario.id === id
  );

  if (!savedScenario) {
    temporaryStatus("Saved scenario not found");
    return;
  }

  applySavedInputs(savedScenario.inputs);

  state.activeScenario = scenarioOrder.includes(
    savedScenario.activeScenario
  )
    ? savedScenario.activeScenario
    : "baseline";

  const allowedMeasures = [
    "debt",
    "interest-gdp",
    "interest-revenue",
  ];

  state.activeMeasure = allowedMeasures.includes(
    savedScenario.activeMeasure
  )
    ? savedScenario.activeMeasure
    : "debt";

  elements.chartMeasure.value = state.activeMeasure;

  elements.tableScenario.value = scenarioOrder.includes(
    savedScenario.tableScenario
  )
    ? savedScenario.tableScenario
    : state.activeScenario;

  syncGrowthMode();
  updateCalculatedNominalGrowth();

  const modelSucceeded = runModel();

  if (!modelSucceeded) {
    temporaryStatus("Saved scenario contains invalid inputs");
    return;
  }

  if (elements.scenariosDialog.open) {
    elements.scenariosDialog.close();
  }

  temporaryStatus(`${savedScenario.name} loaded`);

  announce(
    `${savedScenario.name} was loaded and the model was recalculated.`
  );
}

function renameSavedScenario(id) {
  const savedScenario = state.savedScenarios.find(
    (scenario) => scenario.id === id
  );

  if (!savedScenario) {
    return;
  }

  const requestedName = window.prompt(
    "Rename this scenario:",
    savedScenario.name
  );

  if (requestedName === null) {
    return;
  }

  const name = requestedName.trim();

  if (!name) {
    temporaryStatus("Scenario name cannot be empty");
    return;
  }

  savedScenario.name = name;
  savedScenario.updatedAt = new Date().toISOString();

  if (!persistSavedScenarios()) {
    temporaryStatus("Scenario could not be renamed");
    return;
  }

  renderSavedScenarios();
  temporaryStatus("Scenario renamed");

  announce(`Scenario renamed to ${name}.`);
}

function deleteSavedScenario(id) {
  const savedScenario = state.savedScenarios.find(
    (scenario) => scenario.id === id
  );

  if (!savedScenario) {
    return;
  }

  const confirmed = window.confirm(
    `Delete "${savedScenario.name}"?\n\n` +
      "This removes it permanently from this browser."
  );

  if (!confirmed) {
    return;
  }

  const previousScenarios = [...state.savedScenarios];

  state.savedScenarios = state.savedScenarios.filter(
    (scenario) => scenario.id !== id
  );

  if (!persistSavedScenarios()) {
    state.savedScenarios = previousScenarios;
    temporaryStatus("Scenario could not be deleted");
    return;
  }

  renderSavedScenarios();
  temporaryStatus("Scenario deleted");

  announce(`${savedScenario.name} was deleted.`);
}

function renderSavedScenarios() {
  if (!elements.savedScenariosList) {
    return;
  }

  elements.savedScenariosList.replaceChildren();

  if (state.savedScenarios.length === 0) {
    const emptyState = document.createElement("p");

    emptyState.className = "empty-state";
    emptyState.textContent =
      "No scenarios have been saved in this browser.";

    elements.savedScenariosList.appendChild(emptyState);
    return;
  }

  const orderedScenarios = [...state.savedScenarios].sort(
    (first, second) =>
      new Date(second.updatedAt).getTime() -
      new Date(first.updatedAt).getTime()
  );

  orderedScenarios.forEach((savedScenario) => {
    const item = document.createElement("article");
    item.className = "saved-scenario-item";

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = savedScenario.name;

    const metadata = document.createElement("p");

    const inputs = savedScenario.inputs || {};
    const startYear = inputs.baseYear ?? "—";

    const endYear =
      Number.isFinite(inputs.baseYear) &&
      Number.isFinite(inputs.projectionHorizon)
        ? inputs.baseYear + inputs.projectionHorizon
        : "—";

    const scenarioLabel =
      scenarioMeta[savedScenario.activeScenario]?.label ??
      "Baseline";

    metadata.textContent =
      `${scenarioLabel} · ${startYear}–${endYear} · ` +
      `${formatPercent(inputs.startingDebt)} starting debt · ` +
      `Saved ${formatSavedDate(savedScenario.updatedAt)}`;

    details.appendChild(title);
    details.appendChild(metadata);

    const actions = document.createElement("div");
    actions.className = "saved-scenario-actions";

    const loadButton = createScenarioActionButton(
      "Load",
      "saved-scenario-load"
    );

    loadButton.addEventListener("click", () => {
      loadSavedScenario(savedScenario.id);
    });

    const renameButton = createScenarioActionButton(
      "Rename",
      "saved-scenario-rename"
    );

    renameButton.addEventListener("click", () => {
      renameSavedScenario(savedScenario.id);
    });

    const deleteButton = createScenarioActionButton(
      "Delete",
      "saved-scenario-delete"
    );

    deleteButton.addEventListener("click", () => {
      deleteSavedScenario(savedScenario.id);
    });

    actions.appendChild(loadButton);
    actions.appendChild(renameButton);
    actions.appendChild(deleteButton);

    item.appendChild(details);
    item.appendChild(actions);

    elements.savedScenariosList.appendChild(item);
  });
}

function createScenarioActionButton(label, className) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = className;
  button.textContent = label;

  return button;
}

function applySavedInputs(inputs) {
  if (!inputs || typeof inputs !== "object") {
    return;
  }

  const inputMapping = {
    "base-year": inputs.baseYear,
    "projection-horizon": inputs.projectionHorizon,
    "starting-debt": inputs.startingDebt,
    "target-debt": inputs.targetDebt,

    "real-growth": inputs.realGrowth,
    "inflation-rate": inputs.inflation,
    "direct-nominal-growth": inputs.directNominalGrowth,

    "effective-interest-rate":
      inputs.effectiveInterestRate,

    "primary-balance": inputs.primaryBalance,
    "revenue-ratio": inputs.revenueRatio,
    "annual-stock-flow": inputs.annualStockFlow,

    "favorable-growth-adjustment":
      inputs.favorableGrowthAdjustment,

    "favorable-rate-adjustment":
      inputs.favorableRateAdjustment,

    "favorable-primary-adjustment":
      inputs.favorablePrimaryAdjustment,

    "adverse-growth-shock":
      inputs.adverseGrowthShock,

    "adverse-rate-shock":
      inputs.adverseRateShock,

    "adverse-primary-shock":
      inputs.adversePrimaryShock,

    "adverse-stock-flow-shock":
      inputs.adverseStockFlowShock,

    "shock-start-year": inputs.shockStartYear,
    "shock-duration": inputs.shockDuration,

    "foreign-currency-share":
      inputs.foreignCurrencyShare,

    "depreciation-shock":
      inputs.depreciationShock,
  };

  Object.entries(inputMapping).forEach(([id, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const input = document.getElementById(id);

    if (input) {
      input.value = String(value);
    }
  });

  const growthMode =
    inputs.growthMode === "direct"
      ? "direct"
      : "components";

  const growthModeInput = document.querySelector(
    `input[name="growthMode"][value="${growthMode}"]`
  );

  if (growthModeInput) {
    growthModeInput.checked = true;
  }
}

function loadSavedScenariosFromStorage() {
  try {
    const stored = window.localStorage.getItem(
      STORAGE_KEYS.scenarios
    );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((scenario) => {
      return (
        scenario &&
        typeof scenario === "object" &&
        typeof scenario.id === "string" &&
        typeof scenario.name === "string" &&
        scenario.inputs &&
        typeof scenario.inputs === "object"
      );
    });
  } catch (error) {
    console.warn(
      "FISCAL//COMMAND could not read saved scenarios.",
      error
    );

    return [];
  }
}

function persistSavedScenarios() {
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.scenarios,
      JSON.stringify(state.savedScenarios)
    );

    return true;
  } catch (error) {
    console.warn(
      "FISCAL//COMMAND could not save scenarios.",
      error
    );

    return false;
  }
}

function restoreContrastPreference() {
  let enabled = false;

  try {
    enabled =
      window.localStorage.getItem(STORAGE_KEYS.contrast) ===
      "true";
  } catch (error) {
    console.warn(
      "FISCAL//COMMAND could not read contrast preference.",
      error
    );
  }

  setContrastMode(enabled, false);
}

function setContrastMode(enabled, persist) {
  document.body.classList.toggle(
    "high-contrast",
    enabled
  );

  elements.contrastButton.setAttribute(
    "aria-pressed",
    String(enabled)
  );

  if (!persist) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEYS.contrast,
      String(enabled)
    );
  } catch (error) {
    console.warn(
      "FISCAL//COMMAND could not save contrast preference.",
      error
    );
  }
}

function generateScenarioId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return (
    `scenario-${Date.now()}-` +
    Math.random().toString(16).slice(2)
  );
}

function formatSavedDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
  
  /*
    ============================================================
    CSV EXPORT
    ============================================================
  */

  function exportSelectedCSV() {
    if (!state.results) {
      announce("Run the model before exporting.");
      return;
    }

    const scenarioKey = elements.tableScenario.value;
    const scenario =
      state.results.scenarios[scenarioKey];

    const headers = [
      "Year",
      "Opening Debt (% GDP)",
      "Nominal Growth (%)",
      "Effective Interest Rate (%)",
      "Primary Balance (% GDP)",
      "Stock-Flow Adjustment (% GDP)",
      "Interest Expense (% GDP)",
      "Interest Expense (% Revenue)",
      "Closing Debt (% GDP)",
    ];

    const rows = scenario.rows.map((row) => [
      row.year,
      row.openingDebt.toFixed(4),
      row.nominalGrowth.toFixed(4),
      row.effectiveRate.toFixed(4),
      row.primaryBalance.toFixed(4),
      row.stockFlowAdjustment.toFixed(4),
      row.interestExpenseGDP.toFixed(4),
      row.interestRevenue.toFixed(4),
      row.closingDebt.toFixed(4),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map(csvEscape).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      `fiscal-command-${scenarioKey}-${
        state.results.inputs.baseYear
      }.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    announce(
      `${scenarioMeta[scenarioKey].label} projection exported as CSV.`
    );
  }

  function csvEscape(value) {
    const text = String(value);

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n")
    ) {
      return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
  }

  /*
    ============================================================
    HELPERS
    ============================================================
  */

  function createSVGElement(tagName, attributes = {}) {
    const element = document.createElementNS(
      SVG_NS,
      tagName
    );

    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, String(value));
    });

    return element;
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function formatNumber(value, decimals = 1) {
    if (!Number.isFinite(value)) {
      return "—";
    }

    return value.toFixed(decimals);
  }

  function formatSignedNumber(value, decimals = 1) {
    if (!Number.isFinite(value)) {
      return "—";
    }

    const prefix = value > 0 ? "+" : "";

    return `${prefix}${value.toFixed(decimals)}`;
  }

  function formatPercent(value, decimals = 1) {
    if (!Number.isFinite(value)) {
      return "—";
    }

    return `${value.toFixed(decimals)}%`;
  }

  function formatSignedPercent(value, decimals = 1) {
    if (!Number.isFinite(value)) {
      return "—";
    }

    const prefix = value > 0 ? "+" : "";

    return `${prefix}${value.toFixed(decimals)}%`;
  }

  function average(values) {
    if (values.length === 0) {
      return Number.NaN;
    }

    return (
      values.reduce((total, value) => total + value, 0) /
      values.length
    );
  }

  function announce(message) {
    elements.announcer.textContent = "";

    window.setTimeout(() => {
      elements.announcer.textContent = message;
    }, 20);
  }

  function setStatusDot(colorName) {
    const dot = document.querySelector(".status-dot");

    if (!dot) {
      return;
    }

    const colors = {
      green: {
        color: "#22c55e",
        glow: "rgba(34, 197, 94, 0.34)",
      },
      cyan: {
        color: "#38bdf8",
        glow: "rgba(56, 189, 248, 0.36)",
      },
      amber: {
        color: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.34)",
      },
      red: {
        color: "#ef4444",
        glow: "rgba(239, 68, 68, 0.34)",
      },
    };

    const selected = colors[colorName] || colors.amber;

    dot.style.background = selected.color;
    dot.style.boxShadow =
      `0 0 0 4px ${selected.glow}, ` +
      `0 0 14px ${selected.glow}`;
  }

  function temporaryStatus(message) {
    const active =
      state.results?.scenarios?.[state.activeScenario];

    setText("header-model-status", message);

    window.setTimeout(() => {
      if (active) {
        setText(
          "header-model-status",
          `${active.config.label} · ${active.summary.trajectory}`
        );
      }
    }, 2200);
  }
});
