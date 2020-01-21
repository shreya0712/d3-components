import { Component, Prop, h } from "@stencil/core";
import * as d3 from "d3";

@Component({
  tag: "line-chart1",
  styleUrl: "LineChart.css",
  shadow: true
})
export class Chart {
  private divRef: HTMLDivElement;
  private allDataPoints: Array<any>;
  private yKeys: Array<any>;
  private colors: Array<any>;
  private xKey: string;
  private aggregatedOthers: any;
  private xAxisProps?: {
    dataKey?: string;
    tickSize?: number;
    fontSize?: string;
    strokeWidth?: number;
    formattedKey?: string;
  };
  private yAxisProps?: {
    dataKey?: string[];
    tickSize?: number;
    fontSize?: string;
    strokeWidth?: number;
    colors?: string[];
    axisPrefix?: string;
  };

  @Prop() width: string;
  @Prop() height: string;
  @Prop() marginleft: string;
  @Prop() marginright: string;
  @Prop() margintop: string;
  @Prop() marginbottom: string;
  @Prop() chartdata: string;
  @Prop() xaxis: string;
  @Prop() yaxis: string;
  @Prop() enabledots: number;
  @Prop() connectnulls: number;
  @Prop() formatter: any;
  @Prop() dotcolor: string;

  constructor() {
    this.colors = ["red", "green", "#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"];

    const xAxis = JSON.parse(this.xaxis);
    this.xAxisProps = {
      //   dataKey: xAxis.dataKey,
      tickSize: +xAxis.tickSize,
      fontSize: xAxis.fontSize,
      strokeWidth: +xAxis.strokeWidth,
      formattedKey: xAxis.formattedKey
    };
    const yAxis = JSON.parse(this.yaxis);

    this.yAxisProps = {
      //   dataKey: yAxis.dataKey.split(","),
      tickSize: +yAxis.tickSize,
      fontSize: yAxis.fontSize,
      strokeWidth: +yAxis.strokeWidth,
      colors: yAxis.colors ? yAxis.colors.split(",") : d3.schemeCategory10,
      axisPrefix: yAxis.axisprefix || ""
    };
  }

  createSvgGroup(parent, width, height, marginleft, margintop) {
    d3.select(parent)
      .select("svg")
      .remove();

    const svg = d3
      .select(parent)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g").attr("transform", "translate(" + marginleft + "," + margintop + ")");
    return g;
  }
  createTooltip(g) {
    return (
      g
        .append("foreignObject")
        // .attr("text-anchor", "end")
        .attr("width", 300)
        .attr("height", 300)
        .attr("x", -150)
        .attr("y", -150)
        .append("xhtml:div")
        .attr("class", "tooltip")
        .style("display", "none")
    );
  }

  getVisibleTicks(data, axisLength, tickWidth) {
    return (
      data.filter((_d, i) => {
        const count = Math.floor(axisLength / tickWidth);
        const tickCount = Math.floor(data.length / count);
        return !(i % tickCount);
      }) || []
    );
  }
  appendPath(g, _data, pathGenerator, strokeWidth: number, color: string) {
    return (
      g
        .append("path")
        // .data([data])
        .data([pathGenerator.filteredData])
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke-width", strokeWidth)
        .attr("stroke", color)
        .attr("d", pathGenerator.line)
    );
  }
  animateChart(path, pathLength, duration) {
    path
      .attr("stroke-dasharray", pathLength)
      .attr("stroke-dashoffset", pathLength)
      .transition()
      .duration(duration)
      .attr("stroke-dashoffset", 0);
  }
  addDots(g, data, xFunction, yFunction, xPropName, yPropName, radius) {
    g.selectAll("line-circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-circle")
      .attr("fill", this.dotcolor || "white")
      .attr("stroke-width", 1)
      .attr("stroke", "#3275ff")
      .attr("cx", function(d) {
        return xFunction(d[xPropName]);
      })
      .attr("cy", function(d) {
        return yFunction(d[yPropName]);
      })
      .attr("r", 0)
      .transition()
      .delay(1000)
      .attr("r", d => {
        {
          return d[yPropName] !== null && d[yPropName] !== undefined ? radius : 0;
        }
      });
  }

  getTooltipPosition(chartHeight, chartWidth) {
    return function(x, y) {
      let tooltipX, tooltipY;
      if (x < chartWidth / 2) {
        tooltipX = 10;
      } else tooltipX = -110;

      if (y < chartHeight / 2) {
        tooltipY = 10;
      } else tooltipY = -110;

      return [tooltipX, tooltipY];
    };
  }
  addLegend(g, containerWidth, positionFromTop) {
    const legend = g.append("g").attr("class", "legend");
    (this.yKeys || []).forEach((key, i) => {
      const width = containerWidth / (this.yKeys || [0]).length;
      const singleLegend = legend.append("g").attr("class", "legend " + i);
      singleLegend
        .append("line")
        .attr("x1", width * i + 20)
        .attr("y1", positionFromTop)
        .attr("x2", width * i + 20 + 15)
        .attr("y2", positionFromTop)
        .attr("stroke", this.colors[i])
        .attr("stroke-width", 2);
      singleLegend
        .append("text")
        .text(key)
        .attr("x", width * i + 20 + 20)
        .attr("y", positionFromTop + 5)
        .attr("stroke", "currentColor")
        .attr("font-size", "0.8em")
        .attr("stroke-width", 1)
        .attr("font-weight", "lighter");
    });
    return legend;
  }
  componentDidRender() {
    const chartData = this.chartdata ? JSON.parse(this.chartdata) : {};
    this.allDataPoints = chartData.data || [];
    this.yKeys = chartData.keys;
    this.xKey = chartData.commonKey;
    this.aggregatedOthers = chartData.aggregatedOthers;

    const minMargin = 50;
    let width = +this.width,
      height = +this.height,
      marginbottom = minMargin + (+this.marginbottom || 0),
      margintop = +this.margintop || 10,
      marginleft = minMargin + (+this.marginleft || 0),
      marginright = +this.marginright || 10,
      pathHeight = height - margintop - marginbottom,
      pathwidth = width - marginleft - marginright,
      xTickWidth = 50,
      yTickWidth = 40,
      enableDots = +this.enabledots,
      connectNulls = +this.connectnulls;

    const g = this.createSvgGroup(this.divRef, width, height, marginleft, margintop);

    //scale
    const x = d3.scalePoint().range([0, pathwidth]);
    const y = (this.yKeys || []).map(key => d3.scaleLinear().range([pathHeight, 0]));

    // axis generator
    const xAxisCall = d3.axisBottom(x).tickValues(
      this.allDataPoints.map(d => {
        return d[this.xKey];
      })
    );

    const lineCount = (this.yKeys || []).length;
    // const yTickCount = Math.floor(pathHeight / yTickWidth);
    let yAxisCallLeft, yAxisCallRight;

    yAxisCallLeft = d3.axisLeft(y[0]);
    if (lineCount === 2) {
      yAxisCallRight = d3.axisRight(y[1]);
    }

    //axes groups

    const xAxis = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + pathHeight + ")")
      .attr("stroke-width", isNaN(this.xAxisProps.strokeWidth) ? 1 : this.xAxisProps.strokeWidth);

    const yAxisLeft = g
      .append("g")
      .attr("class", "y-axis-left")
      .attr("stroke-width", isNaN(this.yAxisProps.strokeWidth) ? 1 : this.yAxisProps.strokeWidth);

    let yAxisRight;

    if (lineCount === 2) {
      yAxisRight = g
        .append("g")
        .attr("class", "y-axis-right")
        .attr("stroke-width", isNaN(this.yAxisProps.strokeWidth) ? 1 : this.yAxisProps.strokeWidth)
        .attr("transform", "translate(" + pathwidth + ",0)");
    }
    //path generator

    const linesGenerator: Array<any> = (this.yKeys || []).map((key, i) => {
      let line = d3
        .line()
        .defined(function(d) {
          return d[key] !== null && d[key] !== undefined;
        })
        .x(d => x(d[this.xKey]))
        .y(d => y[i](d[key]))
        .curve(d3.curveMonotoneX);
      const filteredData = this.allDataPoints.filter(line.defined());
      return { line, filteredData: connectNulls ? filteredData : this.allDataPoints };
    });

    //set domains for scales
    x.domain(this.allDataPoints.map(d => d[this.xKey]));

    (this.yKeys || []).forEach((key, i) => {
      y[i].domain([0, d3.max(this.allDataPoints, d => d[this.yKeys[i]])]);
    });

    //generate axes

    xAxis.call(xAxisCall);
    yAxisLeft.call(yAxisCallLeft);
    if (lineCount === 2) yAxisRight.call(yAxisCallRight);

    //generate lines and animate it
    var lines = g.append("g").attr("class", "lines");
    (this.yKeys || []).forEach((_key, i) => {
      const length = this.yKeys.length;
      const linePath = this.appendPath(
        lines,
        this.allDataPoints,
        linesGenerator[i],
        i === length - 1 ? 3 : 2,
        this.colors[i]
      );
      var totalLength = linePath.node().getTotalLength();
      this.animateChart(linePath, totalLength, 1000);
    });

    //legend
    this.addLegend(g, pathwidth, margintop + pathHeight + 20);

    //add dots
    let dotsGroup = g.append("g").attr("class", "dots-group");
    enableDots ? this.addDots(dotsGroup, this.allDataPoints, x, y[0], this.xKey, this.yKeys[0], 3) : null;

    //tooltip
    // const bisectX = d3.bisector(d => d[this.xKey]).left;
    // const focus = g
    //   .append("g")
    //   .attr("class", "focus")
    //   .attr("display", "none");

    // const tooltip = this.createTooltip(focus);
    // tooltip
    //   .append("div")
    //   .attr("class", "tooltip-x")
    //   .attr("style", "color:white");

    // this.yKeys.forEach((key, i) => {
    //   var tooltipSeries = tooltip.append("div");
    //   tooltipSeries
    //     .append("span")
    //     .attr("class", "tooltip-title tooltip-" + key.replace(" ", "_"))
    //     .text(key + ": ")
    //     .attr("font-size", "0.8em")
    //     .attr("style", "color:" + self.yAxisProps.colors[i]);
    //   tooltipSeries.append("span").attr("class", "tooltip-value value-" + key.replace(" ", "_"));
    // });

    // focus
    //   .append("line")
    //   .attr("class", "y-hover-line")
    //   .attr("x1", 0)
    //   .attr("x2", 0)
    //   .attr("stroke", "grey")
    //   .attr("stroke-width", 0.5);
    // const c1 = focus.append("circle").attr("r", 5);
    // c1.attr("stroke-width", 2)
    //   .attr("stroke", "#a7c3ff")
    //   .attr("fill", "#3275ff");

    // const overlay = g
    //   .append("rect")
    //   .attr("class", "overlay")
    //   .attr("height", pathHeight)
    //   .attr("width", pathwidth);
    // const getTooltipPosition = this.getTooltipPosition(pathHeight, pathwidth);
    // overlay
    //   .on("mouseout", function() {
    //     focus.style("display", "none");
    //     tooltip.style("display", "none");
    //   })
    //   .on("click", function() {
    //     focus.style("display", "block");
    //     tooltip.style("display", "block");
    //     var eachBand = x.step();
    //     const position = d3.mouse(this);
    //     var index = Math.round(position[0] / eachBand);
    // var x0 = x.domain()[index];
    // const i = bisectX(data, +x0, 0);
    // const d = data[i];
    // var y0 =
    //   d[self.yAxisProps.dataKey[0]] !== null && d[self.yAxisProps.dataKey[0]] !== undefined
    //     ? d[self.yAxisProps.dataKey[0]]
    //     : d[self.yAxisProps.dataKey[1]];

    // focus.attr("transform", "translate(" + x(x0) + "," + y(y0) + ")");
    // focus
    //   .select(".y-hover-line")
    //   .attr("y2", -y(y0))
    //   .attr("y1", pathHeight - y(y0));
    // const tooltipPosition = getTooltipPosition(x(x0), y(y0));
    // tooltip.attr("style", "left:" + tooltipPosition[0] + "px;top:" + tooltipPosition[1] + "px;");
    //     focus.select(".x-hover-line").attr("x2", -x(x0));
    //     tooltip.select(".tooltip-x").text(d[self.xAxisProps.formattedKey]);
    //     self.yAxisProps.dataKey.forEach((key, i) => {
    //       tooltip
    //         .select(".value-" + key.replace(" ", "_"))
    //         .text(
    //           d[key] !== null && d[key] !== undefined
    //             ? self.formatter
    //               ? self.formatter(d[key]) + self.yAxisProps.axisPrefix
    //               : d[key]
    //             : "-"
    //         )
    //         .attr("style", "color:" + self.yAxisProps.colors[i]);
    //     });
    //   });
  }

  render() {
    return <div ref={el => (this.divRef = el as HTMLDivElement)}></div>;
  }
}
