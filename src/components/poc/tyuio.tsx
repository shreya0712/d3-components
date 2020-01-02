// import { Component, h, getAssetPath } from "@stencil/core";
// import * as d3 from "d3";

// const value0 = "count_distinct_completed_orders",
//   value1 = "sum_completed_gmv",
//   xValue = "city";
// @Component({
//   tag: "bar-chart1",
//   styleUrl: "bar.css",
//   shadow: true,
//   assetsDirs: ["assets"]
// })
// export class Chart {
//   private divRef: HTMLDivElement;
//   private pRef: HTMLParagraphElement;
//   private data: any;
//   private currentRange: string;
//   private margin: any;
//   private width: any;
//   private height: any;
//   private svg: any;
//   private xAxis: any;
//   private yAxisLeft: any;
//   private yAxisRight: any;
//   private x: any;
//   private y0: any;
//   private y1: any;

//   private displayData: any;

//   createSvgGroup(parent, width, height, marginleft, margintop) {
//     d3.select(parent)
//       .select("svg")
//       .remove();

//     const svg = d3
//       .select(parent)
//       .append("svg")
//       .attr("width", width)
//       .attr("height", height);

//     const g = svg.append("g").attr("transform", "translate(" + marginleft + "," + margintop + ")");
//     return g;
//   }
//   updateChart = (data, first) => {
//     const colors = d3.schemeCategory10;

//     //upadate x and y domain
//     this.y0.domain([0, d3.max(data || data, d => d[value0])]);
//     this.y1.domain([0, d3.max(data || data, d => d[value1])]);
//     this.x.domain(
//       (data || data).map(function(d) {
//         return d[xValue];
//       })
//     );
//     const axes = this.svg.append("g").attr("class", "axes");
//     axes
//       .append("g")
//       .attr("class", "x axis")
//       .attr("transform", "translate(0," + this.height + ")")
//       .transition()
//       .duration(1000)
//       .call(this.xAxis);
//     axes
//       .append("g")
//       .attr("class", "y axis axisLeft")
//       .attr("transform", "translate(0,0)")
//       .transition()
//       .duration(1000)
//       .call(this.yAxisLeft);
//     // .append("text")
//     // .attr("y", 6)
//     // .attr("dx", "5em")

//     // .attr("fill", "currentcolor")
//     // .attr("dy", "-2em")
//     // .style("text-anchor", "end")
//     // .text(value0);
//     axes
//       .append("g")
//       .attr("class", "y axis axisRight")
//       .attr("transform", "translate(" + this.width + ",0)")
//       .transition()
//       .duration(1000)
//       .call(this.yAxisRight);
//     // .append("text")
//     // .attr("y", 6)
//     // .attr("fill", "currentcolor")
//     // .attr("dy", "-2em")
//     // .attr("dx", "2em")
//     // .style("text-anchor", "end")
//     // .text(value1);

//     const chart = this.svg.append("g").attr("class", "chart");
//     const bars = chart.selectAll("rect").data(data, d => d[value1]);
//     console.log(bars);

//     bars
//       .exit()
//       .transition()
//       .duration(1000)
//       .attr("height", 0)
//       .remove();
//     if (!first) return;
//     bars
//       // .data(data)
//       .enter()
//       .append("rect")
//       .attr("class", "bar1")
//       .attr("fill", colors[0])
//       .attr("x", d => {
//         return this.x(d[xValue]);
//       })
//       .attr("width", this.x.bandwidth() / 2)
//       .attr("y", d => {
//         return this.y0(d[value0]);
//       })

//       .attr("height", d => {
//         return this.height - this.y0(d[value0]);
//       })
//       .transition()
//       .duration(2000);

//     bars
//       // .data(data)
//       .enter()
//       .append("rect")
//       .attr("fill", colors[1])
//       .attr("class", "bar2")
//       .attr("x", d => {
//         return this.x(d[xValue]) + this.x.bandwidth() / 2;
//       })
//       .attr("width", this.x.bandwidth() / 2)
//       .attr("y", d => {
//         return this.y1(d[value1]);
//       })
//       .attr("height", d => {
//         return this.height - this.y1(d[value1]);
//       })
//       .transition()
//       .duration(1000);
//     this.pRef.innerHTML = this.currentRange;
//   };

//   componentDidRender() {
//     this.margin = { top: 20, left: 50, bottom: 70, right: 60 };
//     this.width = 600 - this.margin.left - this.margin.right;
//     this.height = 400 - this.margin.top - this.margin.bottom;
//     this.svg = this.createSvgGroup(
//       this.divRef,
//       this.width + this.margin.left + this.margin.right,
//       this.height + this.margin.top + this.margin.bottom,
//       this.margin.left,
//       this.margin.top
//     );
//     //scales
//     this.y0 = d3.scaleLinear().range([this.height, 0]);
//     this.y1 = d3.scaleLinear().range([this.height, 0]);
//     this.x = d3
//       .scaleBand()
//       .range([0, this.width])
//       .paddingInner(0.09);

//     this.xAxis = d3.axisBottom(this.x);

//     this.yAxisLeft = d3.axisLeft(this.y0).ticks(4); //here

//     this.yAxisRight = d3.axisRight(this.y1).ticks(6);

//     Promise.all([d3.json(getAssetPath("./assets/completedOrders.json")), d3.json(getAssetPath("./assets/GMV.json"))]).then(
//       ([source0, source1]) => {
//         // Do your stuff. Content of both files is now available in stations and svg
//         const data0 = source0.data.records;
//         const data1 = source1.data.records;
//         let combinedData = [];
//         for (let i = 0; i < data0.length; i++) {
//           const x = data1.filter(d => {
//             return d[xValue] === data0[i][xValue];
//           });
//           combinedData.push({ ...data0[i], [value1]: x[0][value1] });
//         }
//         this.currentRange = "Showing top 1 to 10 of 476";
//         this.data = combinedData;
//         const data = combinedData.slice(0, 10);
//         this.updateChart(data, true);
//       }
//     );
//   }

//   handleChange = e => {
//     const val = e.target.value;
//     this.displayData = this.data.slice(val - 10, val);
//     this.currentRange = "Showing top " + (val - 10) + " to " + val + " of 476";
//     this.updateChart(this.displayData, false);
//   };

//   render() {
//     return (
//       <div>
//         <div ref={el => (this.divRef = el as HTMLDivElement)}></div>
//         <input type="range" min="10" max="476" id="range" value="10" onChange={this.handleChange} />
//         <p ref={el => (this.pRef = el as HTMLParagraphElement)}>{this.currentRange || "Showing 1-10 of 476"}</p>
//       </div>
//     );
//   }
// }
