import { Component, h, getAssetPath, State, Prop } from "@stencil/core";
import * as d3 from "d3";

@Component({
  tag: "scatter-plot",
  styleUrl: "index.css",
  shadow: true
})
export class Chart {
  xAxisCall: any;
  radius: any;
  circle: any;
  data: Array<any>;
  @State() clubOthers: boolean;
  @Prop() height: number;
  @Prop() width: number;
  @Prop() marginleft: string;
  @Prop() marginright: string;
  @Prop() margintop: string;
  @Prop() marginbottom: string;
  @Prop() chartdata: any;
  private divRef: HTMLDivElement;
  allDataPoints: any;
  yKeys: any;
  xKey: any;
  aggregatedOthers: any;
  margin: { bottom: number; top: number; left: number; right: number };
  svg: any;
  x: any;
  y: any;
  colors: any;
  currentRange: string;
  pRef: HTMLParagraphElement;
  yAxis: any;
  xAxis: any;
  xAxisZ: any;
  yAxisZ: any;
  yAxisCall: any;
  tooltip: any;

  createSvgGroup(parent, width, height) {
    d3.select(parent)
      .select("svg")
      .remove();

    const svg = d3
      .select(parent)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    return svg;
  }

  update = () => {
    this.x.domain([0, d3.max(this.data, d => d[this.yKeys[0]])]);
    this.y.domain([0, d3.max(this.data, d => d[this.yKeys[1]])]);
    this.radius.domain([0, d3.max(this.data, d => d[this.yKeys[2]])]);

    this.xAxisCall.scale(this.x);
    this.xAxis
      .transition()
      .duration(500)
      .call(this.xAxisCall);

    this.yAxisCall.scale(this.y);
    this.yAxis
      .transition()
      .duration(500)
      .call(this.yAxisCall);
    this.svg.append("g").call(this.grid);

    this.circle
      .data(this.data, d => d[this.xKey])
      .sort((a, b) => d3.descending(a[this.yKeys[2]], b[this.yKeys[2]]))

      .on("mouseover", d => {
        this.tooltip
          .transition()
          .duration(200)
          .style("opacity", 1);
        this.tooltip
          .html(this.xKey + " : " + d[this.xKey] + "<br/>" + this.yKeys[2] + " : " + d[this.yKeys[2]])
          .style("color", this.colors(d[this.xKey]))
          .style("top", d3.event.pageY + "px");
        d3.event.pageX > this.width / 2
          ? this.tooltip.style("left", d3.event.pageX - this.tooltip.node().clientWidth + "px")
          : this.tooltip.style("left", d3.event.pageX + 5 + "px");
      })
      .on("mouseout", d => {
        this.tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
      })
      .attr("cx", this.x(0))
      .attr("cy", this.y(0))
      .attr("r", 0)
      .transition()
      .delay(500)
      .attr("r", d => this.radius(d[this.yKeys[2]]))
      .attr("cx", d => this.x(d[this.yKeys[0]]))
      .attr("cy", d => this.y(d[this.yKeys[1]]));
  };

  componentWillLoad() {
    this.clubOthers = false;
  }
  componentDidRender() {
    const chartData = this.chartdata ? JSON.parse(this.chartdata) : {};
    this.allDataPoints = chartData.data || [];
    this.yKeys = chartData.keys || [];
    this.xKey = chartData.commonKey;
    this.aggregatedOthers = chartData.aggregatedOthers;
    const topCities = this.allDataPoints.slice(0, 9);
    topCities.push(this.aggregatedOthers);
    this.data = this.clubOthers && this.allDataPoints.length > 15 ? topCities : this.allDataPoints;
    const minMargin = 20;
    let width = +this.width,
      height = +this.height;
    this.margin = {
      bottom: minMargin + (+this.marginbottom || 0),
      top: minMargin + (+this.margintop || 0),
      left: minMargin + (+this.marginleft || 0),
      right: minMargin + (+this.marginright || 0)
    };
    this.svg = this.createSvgGroup(this.divRef, width, height);
    const axes = this.svg.append("g").attr("class", "axes");

    this.xAxis = axes
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + (height - this.margin.bottom) + ")")
      .call(g =>
        g
          .append("text")
          .attr("x", this.width - this.margin.right)
          .attr("y", this.margin.bottom * 0.66)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text(this.yKeys[0])
          .attr("stroke-width", 2)
      );

    this.yAxis = axes
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${this.margin.left},0)`)
      .call(g =>
        g
          .append("text")
          .attr("x", -this.margin.left / 2)
          .attr("y", this.margin.top / 2)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(this.yKeys[1])
          .attr("stroke-width", 2)
      );

    this.yAxisCall = d3.axisLeft().ticks(10, "s");
    //   .tickFormat(d3.format(".0s"));

    this.xAxisCall = d3.axisBottom().ticks(10, "s");
    //   .tickFormat(d3.format(".0s"));

    this.x = d3
      .scaleLinear()
      .nice()
      .rangeRound([this.margin.left, this.width - this.margin.right]);

    this.y = d3
      .scaleLinear()
      .nice()
      .rangeRound([this.height - this.margin.bottom, this.margin.top]);

    this.radius = d3.scaleSqrt().range([0, this.width / 24]);

    this.colors = d3
      .scaleOrdinal(
        this.allDataPoints.map(d => d[this.xKey]),
        d3.schemeSet2
      )
      .unknown("black");

    // this.colors = d3
    //   .scaleOrdinal()
    //   .domain(this.allDataPoints.map(d => d[this.xKey]))
    //   .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    this.circle = this.svg
      .append("g")
      .attr("stroke", "black")
      .selectAll("circle")
      .data(this.data, d => d[this.xKey])
      .join("circle")
      .call(circle => circle.append("title").text(d => d[this.xKey]))

      //   .sort((a, b) => d3.descending(a[this.yKeys[2]], b[this.yKeys[2]]))
      .attr("cx", d => this.x(d[this.yKeys[0]]))
      .attr("cy", d => this.y(d[this.yKeys[1]]))
      .attr("r", d => this.radius(d[this.yKeys[2]]))
      .attr("fill", d => {
        return this.colors(d[this.xKey]);
      });

    // add the tooltip area to the webpage
    this.tooltip && this.tooltip.remove();

    this.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("width", "auto")
      .style("height", "auto")
      .style("background", "rgb(22, 22, 22)")
      .style("border", "1px solid black")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("padding", "5px")
      .style("font-size", "10px")
      .style("max-width", this.width / 2.5)
      .style("position", "absolute");

    this.update();
  }

  grid = g =>
    g
      .attr("stroke", "black")
      .attr("stroke-opacity", 0.1)
      .call(g =>
        g
          .append("g")
          .selectAll("line")
          .data(this.x.ticks(10, "s"))
          .join("line")
          .attr("x1", d => 0.5 + this.x(d))
          .attr("x2", d => 0.5 + this.x(d))
          .attr("y1", this.margin.top)
          .attr("y2", this.height - this.margin.bottom)
      )
      .call(g =>
        g
          .append("g")
          .selectAll("line")
          .data(this.y.ticks(10, "s"))
          .join("line")
          .attr("y1", d => 0.5 + this.y(d))
          .attr("y2", d => 0.5 + this.y(d))
          .attr("x1", this.margin.left)
          .attr("x2", this.width - this.margin.right)
      );

  toggleTopCities = e => {
    if (e.target.checked && this.allDataPoints.length > 15) {
      this.clubOthers = true;
      this.data = this.allDataPoints.slice(0, 9);
      this.data.push(this.aggregatedOthers);
      this.currentRange = "Showing top " + 9 + ` of  ${this.data.length}`;
    } else {
      this.clubOthers = false;
      this.data = this.allDataPoints;
      this.currentRange = `Showing all  ${this.data.length}`;
    }
  };

  handleChange = () => {};
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
            max={(this.allDataPoints || []).length}
            id="range"
            value="10"
            onChange={this.handleChange}
            style={{ marginLeft: `calc((100% - ${this.height}px) / 2)`, width: this.width + "px" }}
          />
        )}
        <p
          ref={el => (this.pRef = el as HTMLParagraphElement)}
          hidden={this.clubOthers || (this.allDataPoints || []).length < 15}
        >
          {this.currentRange || "Showing 1-10 of " + (this.allDataPoints || []).length}
        </p>
      </section>
    );
  }
}
