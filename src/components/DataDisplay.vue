<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col-sm-12 header">Stock Market Data Visualization</div>
      </div>
      <div class="row">
        <div class="col-sm-6 symbol">
          <label for="stockSelect">Select a Stock Instrument:</label>
          <select id="stockSelect" v-model="selectedInstrument">
            <option value="AAPL">Apple Inc. (AAPL)</option>
            <option value="GOOGL">Alphabet Inc. (GOOGL)</option>
            <option value="MSFT">Microsoft Corporation (MSFT)</option>
          </select>
        </div>
        <div class="col-sm-6 period">
          <label for="intervalSelect">Select Data Interval:</label>
          <select
            id="intervalSelect"
            v-model="selectedInterval"
            @click="dropdownClicked"
          >
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div class="col-sm-12 fetch-data">
          <button @click="getSelectedInstrument" class="fetch-data-btn">
            Fetch Data
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col-sm-12 chart">
          <div
            v-if="dailyChart"
            ref="chartContainer"
            class="chart-container"
          ></div>
          <div
            v-if="!dailyChart"
            ref="chartContainerHourly"
            class="chart-container"
          ></div>
        </div>
        <div class="row">
          <div class="col-sm-12 zoom-buttons">
            <button class="zoom-button" @click="zoomIn">+</button>
            <button class="zoom-button" @click="zoomOut">-</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { createChart, PriceScaleMode } from "lightweight-charts";
export default {
  name: "CandlestickChartComponent",
  data() {
    return {
      visibleDataPoints: 50,
      selectedInstrument: null,
      selectedInterval: null,
      apiData: null,
      charRefDaily: null,
      charRefHourly: null,
      seriesHourly: null,
      dailyChart: true,
      chartData: [
        {
          time: "2023-10-01",
          open: 0,
          high: 0,
          low: 0,
          close: 0,
        },
        {
          time: "2023-10-02",
          open: 0,
          high: 0,
          low: 0,
          close: 0,
        },
        {
          time: "2023-10-03",
          open: 0,
          high: 0,
          low: 0,
          close: 0,
        },
      ],
    };
  },
  mounted() {
    this.createChartDaily();
    window.addEventListener("resize", this.handleResize);
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },

  methods: {
    handleResize() {
      if (this.dailyChart) {
        this.charRefDaily.resize(
          this.$refs.chartContainer.clientWidth,
          this.$refs.chartContainer.clientHeight
        );
      } else {
        this.charRefHourly.resize(
          this.$refs.chartContainerHourly.clientWidth,
          this.$refs.chartContainerHourly.clientHeight
        );
      }
    },
    zoomIn() {
      if (this.charRefHourly !== null) {
        const timeScale = this.charRefHourly.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        const newVisibleRange = {
          from: visibleRange.from + (visibleRange.to - visibleRange.from) * 0.2,
          to: visibleRange.to - (visibleRange.to - visibleRange.from) * 0.2,
        };
        timeScale.setVisibleRange(newVisibleRange);
      } else {
        this.visibleDataPoints /= 2; // Adjust the factor to control zoom level
        this.charRefDaily.timeScale().setVisibleLogicalRange({
          from:
            this.charRefDaily.timeScale().getVisibleLogicalRange().to -
            this.visibleDataPoints,
          to: this.charRefDaily.timeScale().getVisibleLogicalRange().to,
        });
      }
    },
    zoomOut() {
      if (this.charRefHourly !== null) {
        const timeScale = this.charRefHourly.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        const newVisibleRange = {
          from: visibleRange.from - (visibleRange.to + visibleRange.from) * 0.2,
          to: visibleRange.to + (visibleRange.to + visibleRange.from) * 0.2,
        };
        timeScale.setVisibleRange(newVisibleRange);
      } else {
        this.visibleDataPoints *= 2; // Adjust the factor to control zoom level
        this.charRefDaily.timeScale().setVisibleLogicalRange({
          from:
            this.charRefDaily.timeScale().getVisibleLogicalRange().to -
            this.visibleDataPoints,
          to: this.charRefDaily.timeScale().getVisibleLogicalRange().to,
        });
      }
    },
    dropdownClicked() {
      if (this.selectedInterval === "daily") {
        this.dailyChart = true;
      } else {
        this.dailyChart = false;
      }
    },
    fetchData() {
      this.$axios
        .get(
          `/api/stocks?symbol=${this.selectedInstrument}&period=${this.selectedInterval}`
        )
        .then((response) => {
          if (this.selectedInterval === "daily") {
            this.charRefHourly?.remove();
            this.charRefHourly = null;
            this.dailyChart = true;
          } else {
            this.charRefDaily?.remove();
            this.charRefDaily = null;
            this.dailyChart = false;
          }
          this.processData(response.data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    },
    getSelectedInstrument() {
      if (this.selectedInstrument && this.selectedInterval) {
        this.fetchData();
      } else if (
        this.selectedInstrument === null &&
        this.selectedInterval !== null
      ) {
        alert("Please select a stock instrument.");
      } else if (
        this.selectedInstrument !== null &&
        this.selectedInterval === null
      ) {
        alert("Please select an interval.");
      } else {
        alert("Please select a stock instrument and an interval.");
      }
    },
    createChartDaily() {
      this.charRefDaily = createChart(this.$refs.chartContainer, {
        width: this.$refs.chartContainer.clientWidth,
        height: 300,
      });
      this.series = this.charRefDaily.addCandlestickSeries();
      this.series.setData(this.chartData);
    },
    createChartHourly() {
      this.charRefHourly = createChart(this.$refs.chartContainerHourly, {
        width: this.$refs.chartContainerHourly.clientWidth,
        height: 300,
      });
      this.seriesHourly = this.charRefHourly.addCandlestickSeries();
      this.seriesHourly.setData(this.chartData);
    },
    changeChartDataDaily() {
      let chart = [];
      this.apiData.map((values) => {
        chart.push({
          time: this.formatDate(values.time),
          open: values.open,
          high: values.high,
          low: values.low,
          close: values.close,
        });
      });
      chart.sort((a, b) => new Date(a.time) - new Date(b.time));
      this.chartData = [];
      this.chartData = chart;
      this.series.setData(this.chartData);
    },

    changeChartDataHourly() {
      let chart = [];
      this.apiData.map((values) => {
        chart.push({
          time: new Date(values.time).getTime(),
          open: values.open,
          high: values.high,
          low: values.low,
          close: values.close,
        });
      });
      chart.sort((a, b) => new Date(a.time) - new Date(b.time));
      this.chartData = [];
      this.chartData = chart;
      this.seriesHourly.setData(this.chartData);
      this.charRefHourly.timeScale().fitContent();
      this.charRefHourly.applyOptions({
        priceScale: {
          mode: PriceScaleMode.Normal,
        },
      });
      this.charRefHourly.timeScale().applyOptions({
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const date = new Date(time);
          const hours = date.getUTCHours();
          const minutes = date.getUTCMinutes();
          return `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
        },
      });
    },

    processData(response) {
      let charData = [];
      if (this.selectedInterval === "daily") {
        response.map((values) => {
          charData.push({
            time: this.formatDate(values.date),
            open: values.openPrice,
            high: values.highPrice,
            low: values.lowPrice,
            close: values.closePrice,
          });
        });
        if (this.charRefDaily === null) {
          this.createChartDaily();
        }
      } else {
        if (this.charRefHourly === null) {
          this.createChartHourly();
        }
        response.map((values) => {
          charData.push({
            time: new Date(values.time).getTime(),
            open: values.open,
            high: values.high,
            low: values.low,
            close: values.close,
          });
        });
      }
      this.setChartData(charData);
    },
    setChartData(charData) {
      this.apiData = charData;
      if (this.selectedInterval === "daily") {
        this.changeChartDataDaily();
      } else {
        this.changeChartDataHourly();
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
  },
};
</script>

<style>
@import "bootstrap/dist/css/bootstrap.css";
.chart-container {
  width: 100%;
  height: 100%;
}
.header {
  padding-top: 20px;
  font-family: EuclidCircularSemibold, sans-serif;
  font-size: 4vw;
  font-style: normal;
  font-weight: 600;
  text-align: center;
  margin-bottom: 50px;
}

@media (max-width: 768px) {
  .header {
    font-size: 40px;
    padding-left: 10px;
    padding-right: 10px;
    margin-bottom: 0px;
    padding-bottom: 0px;
  }
  .zoom-buttons {
    margin-bottom: 10px;
  }
}

.fetch-data {
  text-align: center;
  margin-top: 50px;
}

.fetch-data-btn {
  font-family: EuclidCircularSemibold, sans-serif;
  font-feature-settings: "tnum" on, "lnum" on;
  --ui-lib-typography-line-height: 24px;
  --ui-lib-typography-font-size: 16px;
  font-size: var(--ui-lib-typography-font-size);
  font-style: normal;
  font-weight: 600;
  border-radius: 28px;
  border-width: 2px;
  height: 40px;
  font-size: 16px;
  padding: 0 30px;
  margin-bottom: 10px;
  align-items: center;
  background-color: var(
    --ui-lib-button-color-bg,
    var(--ui-lib-button-default-color-bg)
  );
  border-color: var(
    --ui-lib-button-color-border,
    var(--ui-lib-button-default-color-border)
  );
  border-style: solid;
  box-sizing: border-box;
  color: var(
    --ui-lib-button-color-content,
    var(--ui-lib-button-default-color-content)
  );
  cursor: default;
  display: inline-flex;
  justify-content: center;
  max-width: 100%;
  position: relative;
}

.symbol {
  text-align: center;
  padding-top: 20px;
}
.period {
  text-align: center;
  padding-top: 20px;
}

.zoom-buttons {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.zoom-button {
  width: 30px;
  height: 30px;
  border: 1px solid #333;
  background-color: #fff;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
  margin: 0 5px;
}

.zoom-button:hover {
  background-color: #333;
  color: #fff;
}

.chart {
  justify-content: center;
  display: flex;
}

.buttons {
  justify-content: center;
  align-items: center;
  text-align: center;
}

.zoomInBtn {
  margin-right: 5px;
}

.zoomOutBtn {
  margin-left: 5px;
}

label {
  -webkit-text-fill-color: #0000;
  background: linear-gradient(
    54.39deg,
    #9bc8eb 28.27%,
    #c6b0f8 47.32%,
    #bf84fa 51.53%,
    #5b7de9 61.73%,
    #2962ff 70.81%
  );
  -webkit-background-clip: text;
  background-clip: text;
  background-repeat: no-repeat;
  background-size: 100%;
  font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu,
    sans-serif;
  font-size: 18px;
  font-style: normal;
  font-weight: 600;
  line-height: var(24px);
  margin-right: 5px;
}
</style>
