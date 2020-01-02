import { Component, h, getAssetPath } from "@stencil/core";
import * as d3 from "d3";

@Component({
  tag: "group-bar-chart",
  styleUrl: "gbar.css",
  shadow: true,
  assetsDirs: ["assets"]
})
export class Chart {
  private divRef: HTMLDivElement;
  private pRef: HTMLParagraphElement;
  private margin: any;
  private data: any;
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

  constructor() {}
  createSvgGroup(parent, width, height, marginleft, margintop) {
    d3.select(parent)
      .select("svg")
      .remove();

    const svg = d3
      .select(parent)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // const g = svg.append("g").attr("transform", "translate(" + marginleft + "," + margintop + ")");
    return svg;
  }

  legend = svg => {
    const g = svg
      .attr("transform", `translate(${500},0)`)
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

  componentDidRender() {
    this.margin = { top: 50, right: 40, bottom: 50, left: 40 };
    this.colors = d3.scaleOrdinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    this.svg = this.createSvgGroup(this.divRef, 500, 500, this.margin.left, this.margin.top);

    const axes = this.svg.append("g").attr("class", "axes");

    this.xAxis = axes
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + (500 - this.margin.bottom) + ")");

    this.y0Axis = axes
      .append("g")
      .attr("class", "y axis axisLeft")
      // .attr("color", this.colors[0])
      .attr("transform", "translate(" + this.margin.left + ",0)");

    this.y1Axis = axes
      .append("g")
      //   .attr("stroke", this.colors[1])
      .attr("class", "y axis axisRight")
      .attr("transform", "translate(" + (500 - this.margin.left) + ",0)");

    Promise.all([d3.json(getAssetPath("./assets/completedOrders.json")), d3.json(getAssetPath("./assets/GMV.json"))]).then(
      data => {
        this.currentRange = "Showing top 1 to 10 of 476";
        const orders = { data: data[0].data.records, columns: data[0].data.columns };
        const gmv = { data: data[1].data.records, columns: data[1].data.columns };
        const groupKey = "city";
        let combinedData = [];
        const keys = [orders.columns[1], gmv.columns[1]];
        for (let i = 0; i < gmv.data.length; i++) {
          const x = orders.data.filter(d => {
            return d[groupKey] === gmv.data[i][groupKey];
          });
          combinedData.push({ ...gmv.data[i], [orders.columns[1]]: x[0][orders.columns[1]] });
        }
        this.combinedData = combinedData;
        combinedData = combinedData.slice(0, 10);
        this.data = combinedData;

        this.xAxisCall = d3.axisBottom();
        this.yAxisLeftCall = d3.axisLeft().ticks(null, "s"); //here
        this.yAxisRightCall = d3.axisRight().ticks(null, "s");
        this.barGroup = this.svg.append("g").attr("class", "bar-group");

        this.update(this.svg, groupKey, keys);
        this.svg.append("g").call(this.legend);
      }
    );
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
      .rangeRound([this.margin.left, 500 - this.margin.right])
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
      .rangeRound([500 - this.margin.bottom, this.margin.top]);

    this.y1 = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, d => d[keys[1]]) * 1.1])
      .nice()
      .rangeRound([500 - this.margin.bottom, this.margin.top]);

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
    // this.pRef.innerHTML = this.currentRange;
  };

  handleChange = e => {
    const val = e.target.value;
    this.data = this.combinedData.slice(val - 10, val);
    const groupKey = "city";
    // this.currentRange = "Showing top " + (val - 10) + " to " + val + " of 476";
    const keys = ["count_distinct_completed_orders", "sum_completed_gmv"];
    this.update(this.svg, groupKey, keys);
  };

  render() {
    return (
      <div>
        <div ref={el => (this.divRef = el as HTMLDivElement)}></div>
        <input type="range" min="10" max="476" id="range" value="10" onChange={this.handleChange} />
        {/* <p ref={el => (this.pRef = el as HTMLParagraphElement)}>{this.currentRange || "Showing 1-10 of 476"}</p> */}
      </div>
    );
  }
}
