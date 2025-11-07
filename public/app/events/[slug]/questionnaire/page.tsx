'use client';
import Navbar from "@/components/Navbar";
import PearButton from "@/components/PearButton";
import PearQuestion from "@/components/PearQuestion";
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function QuestionnairePage() {
  return (
    <>
      <Navbar userType="student" />
      <div className="min-h-screen bg-[#EBECE4]">
        <div className="flex flex-col items-center p-6 pt-12">
          <div className="text-center mb-8 max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Questionnaire Form</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Help us find the perfect peer match for you by answering a few questions about your preferences and goals.
            </p>
          </div>
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="p-8 md:p-12">
              <div className="space-y-8">
                <PearQuestion question="What are your learning goals for this event?" number={1} />
                <PearQuestion question="What skills or experiences are you hoping to gain?" number={2} />
                <PearQuestion
                  question="How do you prefer to communicate with your peer?"
                  number={3}
                  type="radio"
                  options={["Email", "Slack", "In-person meetings", "Video calls", "Text messaging"]}
                />
                <PearQuestion
                  question="What is your availability for meetings?"
                  number={4}
                  type="radio"
                  options={["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekends", "Flexible/anytime"]}
                />
                <PearQuestion
                  question="What is your experience level with the event topic?"
                  number={5}
                  type="radio"
                  options={["Beginner", "Intermediate", "Advanced", "Expert"]}
                />
                <PearQuestion
                  question="How do you prefer to learn?"
                  number={6}
                  type="radio"
                  options={["Hands-on practice", "Discussion and theory", "Visual demonstrations", "Reading materials", "Mixed approach"]}
                />
                <PearQuestion
                  question="What is your preferred meeting frequency?"
                  number={7}
                  type="radio"
                  options={["Daily", "Every few days", "Weekly", "Bi-weekly", "As needed"]}
                />
                <PearQuestion question="Is there anything else you'd like your peer to know about you?" number={8} />
                <div className="border-t border-gray-200 pt-8 mt-8">
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      By submitting this questionnaire, you agree to be matched with a peer based on your responses and participate in the event activities.
                    </p>
                    <div className="flex items-center space-x-3">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                        I accept the terms and conditions
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <PearButton
                      text="Submit Questionnaire"
                      className="px-8 py-3 text-lg font-semibold min-w-[200px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
