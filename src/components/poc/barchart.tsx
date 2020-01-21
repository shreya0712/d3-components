import { Component, h, Prop } from "@stencil/core";
import * as d3 from "d3";

const value0 = "count_distinct_completed_orders",
  value1 = "sum_completed_gmv",
  xValue = "city";

@Component({
  tag: "bar-chart",
  styleUrl: "bar.css",
  shadow: true,
  assetsDirs: ["assets"]
})
export class Chart {
  private divRef: HTMLDivElement;
  private pRef: HTMLParagraphElement;
  private data: any;
  @Prop() chartData: any;
  private currentRange: string;
  @Prop() margin: any;
  @Prop() width: any;
  @Prop() height: any;
  private svg: any;
  private xAxisCall: any;
  private yAxisLeftCall: any;
  private yAxisRightCall: any;
  private x: any;
  private y0: any;
  private y1: any;
  private xAxis: any;
  private y0Axis: any;
  private y1Axis: any;
  private chart: any;

  private displayData: any;

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
  updateChart = (data, first) => {
    var t = function() {
      return d3.transition().duration(1000);
    };

    const colors = d3.schemeCategory10;

    //upadate x and y domain
    this.y0.domain([0, d3.max(data, d => d[value0])]);
    this.y1.domain([0, d3.max(data, d => d[value1])]);
    this.x.domain(
      data.map(function(d) {
        return d[xValue];
      })
    );
    //Update Axes
    this.xAxisCall.scale(this.x);
    this.xAxis.transition(t()).call(this.xAxisCall);
    this.yAxisLeftCall.scale(this.y0);
    this.y0Axis.transition(t()).call(this.yAxisLeftCall);
    this.yAxisRightCall.scale(this.y1);
    this.y1Axis.transition(t()).call(this.yAxisRightCall);

    // const bars0 = this.chart.selectAll(".bars0").data(data, d => d[xValue]);
    // const bars1 = this.chart.selectAll(".bars1").data(data, d => d[xValue]);

    const rect = this.chart.selectAll("rect").data(data, d => d.city);

    rect
      .exit()
      .transition(t)
      .attr("height", 0)
      .attr("y", this.y0(0))
      .remove();

    rect
      .exit()
      .transition(t)
      .attr("height", 0)
      .attr("y", this.y1(0))
      .remove();

    // if (!first) return;
    rect
      // .data(data)
      .enter()
      .append("rect")
      .attr("id", d => d[xValue] + "-0")
      .attr("class", "bar1")
      .attr("fill", colors[0])
      .attr("x", d => {
        return this.x(d[xValue]);
      })
      .attr("width", this.x.bandwidth() / 2)
      .attr("height", 0)
      .attr("y", this.y1(0))
      .transition()
      .duration(1000)
      .attr("y", d => {
        return this.y0(d[value0]);
      })
      .attr("height", d => {
        return this.height - this.y0(d[value0]);
      })
      .transition()
      .duration(2000);

    rect
      // .data(data)
      .enter()
      .append("rect")
      .attr("id", d => d[xValue] + "-1")
      .attr("fill", colors[1])
      .attr("class", "bar2")
      .attr("x", d => {
        return this.x(d[xValue]) + this.x.bandwidth() / 2;
      })
      .attr("width", this.x.bandwidth() / 2)
      .attr("height", 0)
      .attr("y", this.y1(0))
      .transition()
      .duration(1000)
      .attr("y", d => {
        return this.y1(d[value1]);
      })
      .attr("height", d => {
        return this.height - this.y1(d[value1]);
      });
    this.pRef.innerHTML = this.currentRange;
  };

  componentDidRender() {
    const colors = d3.schemeCategory10;
    this.margin = { top: 20, left: 80, bottom: 70, right: 80 };
    this.width = 500 - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;
    this.svg = this.createSvgGroup(
      this.divRef,
      this.width + this.margin.left + this.margin.right,
      this.height + this.margin.top + this.margin.bottom,
      this.margin.left,
      this.margin.top
    );
    //scales
    this.y0 = d3.scaleLinear().range([this.height, 0]);
    this.y1 = d3.scaleLinear().range([this.height, 0]);
    this.x = d3
      .scaleBand()
      .range([0, this.width])
      .paddingInner(0.09)
      .paddingOuter(0.1);

    this.xAxisCall = d3.axisBottom();
    this.yAxisLeftCall = d3.axisLeft().ticks(4); //here
    this.yAxisRightCall = d3.axisRight().ticks(6);

    const axes = this.svg.append("g").attr("class", "axes");

    this.xAxis = axes
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")");

    this.y0Axis = axes
      .append("g")
      .attr("class", "y axis axisLeft")
      .attr("stroke", colors[0])
      .attr("transform", "translate(0,0)");

    this.y1Axis = axes
      .append("g")
      .attr("stroke", colors[1])
      .attr("class", "y axis axisRight")
      .attr("transform", "translate(" + this.width + ",0)");

    this.chart = this.svg.append("g").attr("class", "chart");

    // Do your stuff. Content of both files is now available in stations and svg
    const data0 = this.chartData[0];
    const data1 = this.chartData[1];
    let combinedData = [];
    for (let i = 0; i < data0.length; i++) {
      const x = data1.filter(d => {
        return d[xValue] === data0[i][xValue];
      });
      combinedData.push({ ...data0[i], [value1]: x[0][value1] });
    }
    this.currentRange = "Showing top 1 to 10 of 476";
    this.data = combinedData;
    const data = combinedData.slice(0, 10);
    this.updateChart(data, true);
    // Labels
    var xLabel = this.svg
      .append("text")
      .attr("class", "x axisLabel")
      .attr("y", this.height + 50)
      .attr("x", this.width / 2)
      .attr("font-size", "20px")
      .attr("text-anchor", "middle")
      .text(xValue);
    var yLabel0 = this.svg
      .append("text")
      .attr("class", "y axisLabel")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -170)
      .attr("fill", colors[0])
      .attr("font-size", "20px")
      .attr("text-anchor", "middle")
      .text(value0);

    var yLabel1 = this.svg
      .append("text")
      .attr("class", "y axisLabel")
      .attr("transform", "rotate(-90)")
      .attr("y", this.width + this.margin.left - 5)
      .attr("x", -170)
      .attr("fill", colors[1])
      .attr("font-size", "20px")
      .attr("text-anchor", "middle")
      .text(value1);
  }

  handleChange = e => {
    const val = e.target.value;
    this.displayData = this.data.slice(val - 10, val);
    this.currentRange = "Showing top " + (val - 10) + " to " + val + " of 476";
    this.updateChart(this.displayData, false);
  };

  render() {
    return (
      <div>
        <div ref={el => (this.divRef = el as HTMLDivElement)}></div>
        <input type="range" min="10" max="476" id="range" value="10" onChange={this.handleChange} />
        <p ref={el => (this.pRef = el as HTMLParagraphElement)}>{this.currentRange || "Showing 1-10 of 476"}</p>
      </div>
    );
  }
}
