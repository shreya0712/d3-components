import { Component, Prop, h } from "@stencil/core";
import * as d3 from "d3";

@Component({
  tag: "line-chart",
  styleUrl: "chart.css",
  shadow: true
})
export class Chart {
  private divRef?: HTMLDivElement;

  @Prop() width: string;
  @Prop() height: string;
  @Prop() marginleft: string;
  @Prop() marginright: string;
  @Prop() margintop: string;
  @Prop() marginbottom: string;
  @Prop() data: string;

  componentDidRender() {
    const data = this.data ? JSON.parse(this.data) : [];
    const t = d3.transition().duration(500);
    let width = +this.width || 0,
      height = +this.height || 0,
      marginbottom = +this.marginbottom || 0,
      margintop = +this.margintop || 0,
      marginleft = +this.marginleft || 0,
      marginright = +this.marginright || 0;

    const dataGroup = d3
      .select(this.divRef)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("width", width - marginleft - marginright)
      .attr("height", height - margintop - marginbottom)
      .attr("transform", "translate(" + marginleft + "," + margintop + ")");

    const line = d3
      .line()
      .x(d => x(d.date))
      .y(d => y(d.value));
    const parseTime = d3.timeParse("%m/%d/%Y");

    data.forEach(d => {
      d.date = parseTime(d.date);
    });

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width - marginleft - marginright]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, d => d.value))
      .range([height - margintop - marginbottom, 0]);

    dataGroup
      .append("path")
      .data([data])
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("d", line)
      .attr("stroke-width", 0)
      .transition(t)
      .attr("stroke-width", 2);

    const xAxisGroup = dataGroup
      .append("g")
      .attr("class", "xAxisGroup")
      .attr("transform", `translate(0, ${height - margintop - marginbottom})`);
    const xAxis = d3.axisBottom(x).ticks(d3.timeDay);
    xAxis(xAxisGroup);

    const yAxisGroup = dataGroup.append("g").attr("class", "yAxisGroup");
    const yAxis = d3.axisLeft(y);
    yAxis(yAxisGroup);
  }
  render() {
    return <div ref={el => (this.divRef = el as HTMLDivElement)}></div>;
  }
}
