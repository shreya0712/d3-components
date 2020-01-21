import { Component, h, getAssetPath, State, Prop } from "@stencil/core";
import * as d3 from "d3";

@Component({
  tag: "grouped-bar-chart",
  styleUrl: "gbar.css",
  shadow: true,
  assetsDirs: ["assets"]
})
export class Chart {
  private divRef: HTMLDivElement;
  private pRef: HTMLParagraphElement;
  @Prop() margin: any;
  private data: any;
  @Prop() chartData: any;
  private combinedData: any;
  private y0: any;
  private y1: any;
  private x0: any;
  private x1: any;
  private colors: any;
  private svg: any;
  private barGroup: any;
  private xAxisCall: any;
  private yAxisLeftCall: any;
  private yAxisRightCall: any;
  private xAxis: any;
  private y0Axis: any;
  private y1Axis: any;
  private currentRange: string;
  private others: any;
  @State() clubOthers: boolean;
  @Prop() height: number;
  @Prop() width: number;

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
      .attr("margin-left", `calc((100% - ${this.height}px) / 2)`);

    return svg;
  }

  legend = svg => {
    const g = svg
      .attr("transform", `translate(${this.width},0)`)
      .attr("text-anchor", "end")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g")
      .data(
        this.colors
          .domain()
          .slice()
          .reverse()
      )
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
    this.margin = { top: 50, right: 40, bottom: 50, left: 40 };
    this.colors = d3.scaleOrdinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    this.svg = this.createSvgGroup(this.divRef, this.width, this.height, this.margin.left, this.margin.top);

    const axes = this.svg.append("g").attr("class", "axes");

    this.xAxis = axes
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + (this.height - this.margin.bottom) + ")");

    this.y0Axis = axes
      .append("g")
      .attr("class", "y axis axisLeft")
      // .attr("color", this.colors[0])
      .attr("transform", "translate(" + this.margin.left + ",0)");

    this.y1Axis = axes
      .append("g")
      //   .attr("stroke", this.colors[1])
      .attr("class", "y axis axisRight")
      .attr("transform", "translate(" + (this.width - this.margin.left) + ",0)");

    this.currentRange = "Showing top 1 to 10 of 476";

    const groupKey = "city";
    let combinedData = [];
    const keys = this.chartData.keys;

    // this.clubOthers && combinedData.push(others);
    this.combinedData = this.chartData.data;
    this.others = this.chartData.aggregateOthers;
    const topCities = combinedData.slice(0, 9);
    topCities.push(this.others);
    this.data = this.clubOthers ? topCities : combinedData.slice(0, 10);
    this.xAxisCall = d3.axisBottom();
    this.yAxisLeftCall = d3.axisLeft().ticks(null, "s"); //here
    this.yAxisRightCall = d3.axisRight().ticks(null, "s");
    this.barGroup = this.svg.append("g").attr("class", "bar-group");
    this.update(this.svg, groupKey, keys);
    this.svg.append("g").call(this.legend);
  }
  update = (svg, groupKey, keys) => {
    //scales
    this.x0 = d3
      .scaleBand()
      .domain(
        this.data.map(d => {
          return d[groupKey];
        })
      )
      .rangeRound([this.margin.left, this.width - this.margin.right])
      .paddingInner(0.1);

    this.x1 = d3
      .scaleBand()
      .domain(keys)
      .rangeRound([0, this.x0.bandwidth()])
      .padding(0.05);

    this.y0 = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, d => d[keys[0]])])
      .nice()
      .rangeRound([this.height - this.margin.bottom, this.margin.top]);

    this.y1 = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, d => d[keys[1]]) * 1.1])
      .nice()
      .rangeRound([this.height - this.margin.bottom, this.margin.top]);

    const barGroup = svg.select(".bar-group");

    const rect = barGroup.selectAll("rect").data(this.data, d => d.city);

    rect
      .exit()
      .transition()
      .duration(500)
      .attr("height", 0)
      .attr("y", (d, i) => (i === 0 ? this.y0(0) : this.y1(0)))
      .remove();

    barGroup
      .append("g")
      .selectAll("g")
      .data(this.data)
      .join("g")
      .attr("transform", d => {
        return `translate(${this.x0(d[groupKey])},0)`;
      })
      .selectAll("rect")
      .attr("class", "bar")
      .data(d => {
        return keys.map(key => {
          return { key, value: d[key] };
        });
      })
      .join("rect")
      .attr("x", d => this.x1(d.key))
      .attr("y", (d, i) => (i === 0 ? this.y0(0) : this.y1(0)))
      .attr("height", 0)
      .attr("width", this.x1.bandwidth())
      .transition()
      .duration(500)
      .attr("y", (d, i) => {
        return i === 0 ? this.y0(d.value) : this.y1(d.value);
      })
      .attr("height", (d, i) => (i === 0 ? this.y0(0) - this.y0(d.value) : this.y1(0) - this.y1(d.value)))
      .attr("fill", d => this.colors(d.key));

    this.xAxisCall.scale(this.x0);
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

    this.yAxisLeftCall.scale(this.y1);
    this.y0Axis
      .transition()
      .duration(500)
      .call(this.yAxisLeftCall);
    this.yAxisRightCall.scale(this.y0);
    this.y1Axis
      .transition()
      .duration(500)
      .call(this.yAxisRightCall);
    this.pRef.innerHTML = this.currentRange;
  };

  handleChange = e => {
    const val = e.target.value;
    this.data = this.combinedData.slice(val - 10, val);
    const groupKey = "city";
    this.currentRange = "Showing top " + (val - 10) + " to " + val + " of 476";
    const keys = this.chartData.keys; //["count_distinct_completed_orders", "sum_completed_gmv"];
    this.update(this.svg, groupKey, keys);
  };

  toggleTopCities = e => {
    if (e.target.checked) {
      this.clubOthers = true && this.chartData.data.length > 12;
      this.data = this.combinedData.slice(0, 9);
      this.data.push(this.others);
      this.currentRange = "Showing top " + 9 + " of 476";
    } else {
      this.clubOthers = false && this.chartData.data.length > 12;
      this.data = this.combinedData.slice(0, 10);
      this.currentRange = "Showing 1-10 of 476";
    }
    const groupKey = "city";
    const keys = this.chartData.keys;
    this.update(this.svg, groupKey, keys);
  };
  render() {
    return (
      <div>
        <input type="checkbox" name="nameOfChoice" value="1" checked onClick={this.toggleTopCities} /> Show only top cities
        <div ref={el => (this.divRef = el as HTMLDivElement)}></div>
        {this.clubOthers ? null : (
          <input type="range" min="10" max="476" id="range" value="10" onChange={this.handleChange} />
        )}
        <p ref={el => (this.pRef = el as HTMLParagraphElement)}>{this.currentRange || "Showing 1-10 of 476"}</p>
      </div>
    );
  }
}
