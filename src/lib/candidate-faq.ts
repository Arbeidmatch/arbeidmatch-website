/**
 * The questions candidates ask us, answered once, on /for-candidates.
 *
 * HIS INSTRUCTION, 12 October 2026: a section on the site, in the candidates'
 * part, where people can read the answers to their questions. The questions are
 * the ones the Facebook page has actually received (read off its inbox the same
 * day), and the answers are the same ones the Messenger assistant gives, so the
 * site and the chat say one thing.
 *
 * His rules for every answer, same day: written like a sales expert, a direction
 * toward the next step and never a negation; and the next step is a profile in
 * our system, so that we can contact the candidate or present them to the
 * employers we work with.
 */

export type CandidateFaqItem = { question: string; answer: string };

export const CANDIDATE_FAQ: CandidateFaqItem[] = [
  {
    question: "Is the position I saw still open?",
    answer:
      "Positions fill quickly, and candidates with a profile with us are the first we contact when a position in their trade opens. Create your profile and we can present you to the right employers.",
  },
  {
    question: "Which trades do you recruit for?",
    answer:
      "Construction, industry and automotive mechanics, and through our contract clients many other fields as well. Your experience counts, whatever the field, so describe it in your profile: where, how long and what you worked on.",
  },
  {
    question: "Who will employ me?",
    answer:
      "In construction, industry and automotive mechanics we employ and recruit ourselves, and in other fields we recruit for our contract clients. Who the employer is for each position we confirm clearly before any contract.",
  },
  {
    question: "How much is the pay?",
    answer: "Pay differs from position to position, and we present all the conditions before any employment.",
  },
  {
    question: "Is accommodation included?",
    answer:
      "Some positions include accommodation, and we present the conditions of each position before any employment.",
  },
  {
    question: "Do you pay for the trip to Norway?",
    answer: "You organise and pay your own trip to Norway. Some positions include accommodation once you are there.",
  },
  {
    question: "Where are the jobs?",
    answer: "We work with employers across Norway, and we present the location of each position.",
  },
  {
    question: "Who can apply?",
    answer: "We recruit citizens of the European Union and the European Economic Area, with a valid identity document.",
  },
  {
    question: "How much English do I need?",
    answer:
      "A conversational level of English or Norwegian: enough to follow instructions and talk with the crew on site.",
  },
  {
    question: "I have experience but a diploma is missing. Can I apply?",
    answer:
      "We work with qualified tradespeople and people with recent experience in a trade. Hands-on experience counts just as much, when your profile shows where, how long and what you worked on.",
  },
  {
    question: "Where do I send my CV?",
    answer:
      "Upload your CV, in English or Norwegian, to your profile, where our recruiters see it. You can also send a CV in English to cv@arbeidmatch.no.",
  },
  {
    question: "I need help writing a CV.",
    answer:
      "Our CV guide at arbeidmatch.no/cv helps you write an English CV in about fifteen minutes, ready to upload to your profile.",
  },
  {
    question: "We are a couple or a team. Can we come together?",
    answer:
      "Each person creates their own profile, with their own trade. That way we can present each of you for the right positions.",
  },
  {
    question: "When can I start?",
    answer: "The start date is agreed with the employer for each position, around when you are available.",
  },
  {
    question: "Do I need a D-number?",
    answer: "We explain the D-number and tax registration steps once you are selected for a position.",
  },
  {
    question: "I applied earlier. What happens now?",
    answer:
      "Candidates with a complete profile, an English CV and detailed experience are the first we contact when a position in their trade opens. Check that your profile is complete.",
  },
  {
    question: "How do I talk to a recruiter?",
    answer:
      "A recruiter contacts you from your profile, where you leave your phone number safely. For a specific question, message us on our Facebook page.",
  },
  {
    question: "Do I pay anything?",
    answer: "Recruitment through ArbeidMatch is free for candidates, at every stage.",
  },
];
