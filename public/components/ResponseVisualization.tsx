"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ResponseVisualizationProps {
  question: any;
  participants: any[];
  allResponses: any[];
  questionIndex: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function ResponseVisualization({ 
  question, 
  participants, 
  allResponses, 
  questionIndex 
}: ResponseVisualizationProps) {
  // Get responses for this specific question
  const questionResponses = allResponses.filter(response => 
    response.question_id === question.id
  );

  // If it's a multiple choice question (has options)
  if (question.options && question.options.length > 0) {
    // Count responses for each option
    const optionCounts = question.options.reduce((acc: any, option: string) => {
      acc[option] = 0;
      return acc;
    }, {});

    // Count "No Response" for participants who didn't answer
    let noResponseCount = participants.length - questionResponses.length;

    questionResponses.forEach((response: any) => {
      if (optionCounts.hasOwnProperty(response.answer)) {
        optionCounts[response.answer]++;
      }
    });

    // Prepare data for chart
    const chartData = Object.entries(optionCounts).map(([option, count]) => ({
      option: option,
      count: count as number,
      percentage: Math.round(((count as number) / participants.length) * 100)
    }));

    // Add "No Response" if there are any
    if (noResponseCount > 0) {
      chartData.push({
        option: "No Response",
        count: noResponseCount,
        percentage: Math.round((noResponseCount / participants.length) * 100)
      });
    }

    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {questionIndex + 1}. {question.question}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-700 mb-4">Response Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="option" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value} responses`, 'Count']}
                />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-700 mb-4">Response Percentages</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.option}: ${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} responses`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{questionResponses.length}</div>
              <div className="text-sm text-blue-800">Total Responses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
              <div className="text-sm text-blue-800">Total Participants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((questionResponses.length / participants.length) * 100)}%
              </div>
              <div className="text-sm text-blue-800">Response Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{question.options.length}</div>
              <div className="text-sm text-blue-800">Options</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For open-ended questions (text responses)
  else {
    // Get word frequency analysis
    const allText = questionResponses
      .map((response: any) => response.answer)
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove punctuation
      .split(/\s+/)
      .filter((word: string) => word.length > 3); // Filter short words

    const wordFrequency: { [key: string]: number } = {};
    allText.forEach((word: string) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    // Get top 10 most common words
    const topWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    const noResponseCount = participants.length - questionResponses.length;

    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {questionIndex + 1}. {question.question}
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Response Samples */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-700 mb-4">Sample Responses</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {questionResponses.slice(0, 5).map((response: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50">
                  <p className="text-sm text-gray-700 italic">
                    "{response.answer}"
                  </p>
                </div>
              ))}
              {questionResponses.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  ... and {questionResponses.length - 5} more responses
                </p>
              )}
            </div>
          </div>

          {/* Word Frequency */}
          {topWords.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-4">Common Keywords</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topWords} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="word" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 bg-green-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{questionResponses.length}</div>
              <div className="text-sm text-green-800">Text Responses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{participants.length}</div>
              <div className="text-sm text-green-800">Total Participants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((questionResponses.length / participants.length) * 100)}%
              </div>
              <div className="text-sm text-green-800">Response Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(allText.length / questionResponses.length || 0)}
              </div>
              <div className="text-sm text-green-800">Avg. Words</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}