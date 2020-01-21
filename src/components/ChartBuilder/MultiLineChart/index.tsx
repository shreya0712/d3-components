import { Component, h, getAssetPath, State, Prop } from "@stencil/core";
import * as d3 from "d3";

@Component({
  tag: "multi-line-chart",
  styleUrl: "index.css",
  shadow: true,
  assetsDirs: ["assets"]
})
export class MultiSeriesLineChart {
  private divRef: HTMLDivElement;
  private pRef: HTMLParagraphElement;
  private data: any;
  @Prop() chartdata: any;
  private combinedData: any;
  private y0: any;
  private y1: any;
  private x0: any;
  private x1: any;
  private x: any;
  private colors: any;
  private svg: any;
  private barGroup: any;
  private xAxisCall: any;
  private yAxisLeftCall: any;
  private yAxisRightCall: any;
  private xAxis: any;
  private y0Axis: any;
  private y1Axis: any;
  private margin: any;
  private currentRange: string;
  private others: any;
  @State() clubOthers: boolean;
  @Prop() height: number;
  @Prop() width: number;
  @Prop() marginleft: string;
  @Prop() marginright: string;
  @Prop() margintop: string;
  @Prop() marginbottom: string;
  private allDataPoints: Array<any>;
  private yKeys: any;
  private xKey: any;
  private aggregatedOthers: any;
  line: any;

  constructor() {}
  createSvgGroup(parent, width, height, marginleft, margintop) {
    d3.select(parent)
      .select("svg")
      .remove();

    const svg = d3
      .select(parent)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("height", height);
    // .attr("margin-left", `calc((100% - ${this.height}px) / 2)`);

    return svg;
  }

  legend = svg => {
    const g = svg
      .attr("transform", `translate(${this.width},0)`)
      .attr("text-anchor", "end")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g")
      .data(this.colors.domain().slice())
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    g.append("rect")
      .attr("x", -19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", this.colors);

    g.append("text")
      .attr("x", -24)
      .attr("y", 9.5)
      .attr("dy", "0.35em")
      .text(d => d);
  };

  appendChart() {}

  componentWillLoad() {
    this.clubOthers = true;
  }

  componentDidRender() {
    console.log(this);
    const chartData = this.chartdata ? JSON.parse(this.chartdata) : {};
    this.allDataPoints = chartData.data || [];
    this.yKeys = chartData.keys || [];
    this.xKey = chartData.commonKey;
    this.aggregatedOthers = chartData.aggregatedOthers;

    const minMargin = 50;
    let width = +this.width,
      height = +this.height;
    this.margin = {
      bottom: minMargin + (+this.marginbottom || 10),
      top: minMargin + (+this.margintop || 0),
      left: minMargin + (+this.marginleft || 0),
      right: minMargin + (+this.marginright || 0)
    };
    // pathHeight = height - margintop - marginbottom,
    // pathwidth = width - marginleft - marginright;

    this.colors = d3.scaleOrdinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    this.svg = this.createSvgGroup(this.divRef, width, height, this.margin.left, this.margin.top);

    const axes = this.svg.append("g").attr("class", "axes");

    this.xAxis = axes
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + (height - this.margin.bottom) + ")");

    this.y0Axis = axes
      .append("g")
      .attr("class", "y axis axisLeft")
      // .attr("color", this.colors[0])
      .attr("transform", "translate(" + this.margin.left + ",0)");

    if ((this.yKeys || []).length === 2) {
      this.y1Axis = axes
        .append("g")
        //   .attr("stroke", this.colors[1])
        .attr("class", "y axis axisRight")
        .attr("transform", "translate(" + (this.width - this.margin.right) + ",0)");
    }
    this.currentRange = "Showing top 1 to 10 of " + (this.allDataPoints || []).length;

    const groupKey = this.xKey;

    const topCities = this.allDataPoints.slice(0, 9);
    topCities.push(this.aggregatedOthers);
    this.data = this.clubOthers && this.allDataPoints.length > 15 ? topCities : this.allDataPoints.slice(0, 10);

    // Add the line for the first time

    //line genrator
    this.line = this.yKeys.map((key, i) => {
      this.svg
        .append("path")
        .attr("class", "line-" + i)
        .attr("fill", "none")
        .attr("stroke", this.colors(key))
        .attr("stroke-width", "2px");
      return d3
        .line()
        .x(d => {
          return this.x(d[this.xKey]);
        })
        .y(d => {
          return i === 0 ? this.y0(d[key]) : this.y1([d[key]]);
        })
        .curve(d3.curveMonotoneX);
    });
    this.xAxisCall = d3.axisBottom();
    this.yAxisLeftCall = d3.axisLeft().ticks(null, "s"); //here
    if ((this.yKeys || []).length === 2) {
      this.yAxisRightCall = d3.axisRight().ticks(null, "s");
    }
    this.barGroup = this.svg.append("g").attr("class", "bar-group");
    this.update(this.svg, groupKey, this.yKeys || []);
    this.svg.append("g").call(this.legend);
  }
  update = (svg, groupKey, keys) => {
    this.x = d3
      .scalePoint()
      .range([+this.margin.left, +this.width - +this.margin.right])
      .domain(
        this.data.map(d => {
          return d[groupKey];
        })
      );

    this.y0 = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, d => d[keys[0]])])
      .nice()
      .rangeRound([this.height - this.margin.bottom, this.margin.top]);
    // if ((this.yKeys || []).length === 2) {
    this.y1 = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, d => d[keys[1]])])
      .nice()
      .rangeRound([this.height - this.margin.bottom, this.margin.top]);
    // }
    this.yKeys.forEach((key, index) => {
      this.svg
        .select(".line-" + index)
        .transition()
        .duration(500)
        .attr("d", this.line[index](this.data));
    });

    this.xAxisCall.scale(this.x);
    this.xAxis
      .transition()
      .duration(500)
      .call(this.xAxisCall);

    svg
      .select(".x-axis")
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    this.yAxisLeftCall.scale(this.y0);
    this.y0Axis
      .transition()
      .duration(500)
      .call(this.yAxisLeftCall);
    if ((this.yKeys || []).length === 2) {
      this.yAxisRightCall.scale(this.y1);
      this.y1Axis
        .transition()
        .duration(500)
        .call(this.yAxisRightCall);
    }
    this.pRef.innerHTML = this.currentRange;
  };

  handleChange = e => {
    const val = e.target.value;
    this.data = this.allDataPoints.slice(val - 10, val);
    const groupKey = this.xKey;
    this.currentRange = "Showing top " + (val - 10) + " to " + val + " of " + this.data.length;
    const keys = this.yKeys; //["count_distinct_completed_orders", "sum_completed_gmv"];
    this.update(this.svg, groupKey, keys || []);
  };

  toggleTopCities = e => {
    if (e.target.checked && this.allDataPoints.length > 15) {
      this.clubOthers = true;
      this.data = this.allDataPoints.slice(0, 9);
      this.data.push(this.aggregatedOthers);
      this.currentRange = "Showing top " + 9 + ` of  ${this.data.length}`;
    } else {
      this.clubOthers = false;
      this.data = this.allDataPoints.slice(0, 10);
      this.currentRange = `Showing 1-10 of ${this.data.length}`;
    }
    const keys = this.yKeys;
    this.update(this.svg, this.xKey, keys || []);
  };
  render() {
    return (
      <section>
        <input type="checkbox" name="nameOfChoice" value="1" checked={this.clubOthers} onClick={this.toggleTopCities} />
        Show only top entries
        {
          <div
            ref={el => (this.divRef = el as HTMLDivElement)}
            class="chart"
            style={{ marginLeft: `calc((100% - ${this.height}px) / 2)` }}
          ></div>
        }
        {this.clubOthers || (this.allDataPoints || []).length < 15 ? null : (
          <input
            type="range"
            min="10"
            max="476"
            id="range"
            value="10"
            onChange={this.handleChange}
            style={{ marginLeft: `calc((100% - ${this.height}px) / 2)`, width: this.width + "px" }}
          />
        )}
        <p ref={el => (this.pRef = el as HTMLParagraphElement)}>{this.currentRange || "Showing 1-10 of 476"}</p>
      </section>
    );
  }
}
