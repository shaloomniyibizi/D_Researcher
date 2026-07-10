import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  AiJobStatus,
  AiJobType,
  CitationStatus,
  DefenseStatus,
  DocumentStatus,
  DocumentType,
  EvaluationStatus,
  MeetingStatus,
  MilestoneStatus,
  MilestoneType,
  NotificationChannel,
  NotificationStatus,
  Prisma,
  PrismaClient,
  ProjectMemberRole,
  ProjectStatus,
  ProjectVisibility,
  RepositoryRecordType,
  SourceType,
  SubmissionStatus,
  TaskPriority,
  TaskStatus,
  UserRole,
  UserStatus,
} from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Prisma seed.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const id = (model: string, index: number) => `seed_${model}_${index + 1}`;
const day = (value: number) => String(value).padStart(2, "0");
const dt = (month: number, value: number, time = "12:00:00") =>
  new Date(`2026-${day(month)}-${day(value)}T${time}.000Z`);
const decimal = (value: string) => new Prisma.Decimal(value);

const institutionSeeds = [
  ["Kigali Institute of Applied Sciences", "kias", "kias.ac.rw"],
  ["Great Lakes Technical University", "gltu", "gltu.ac.rw"],
  ["Rwanda School of Digital Innovation", "rsdi", "rsdi.ac.rw"],
  ["East Africa University of Technology", "eaut", "eaut.ac.rw"],
  ["Kigali College of Engineering", "kce", "kce.ac.rw"],
] as const;

const departmentSeeds = [
  ["Computer Science", "CS"],
  ["Information Systems", "IS"],
  ["Data Science", "DS"],
  ["Software Engineering", "SE"],
  ["Cybersecurity", "CYB"],
] as const;

const areaSeeds = [
  ["Artificial Intelligence in Education", "artificial-intelligence-education"],
  ["Health Informatics", "health-informatics"],
  ["Climate Smart Agriculture", "climate-smart-agriculture"],
  ["Secure FinTech Systems", "secure-fintech-systems"],
  ["Human Computer Interaction", "human-computer-interaction"],
] as const;

const supervisors = [
  ["Dr. Jean Claude Nkurunziza", "jeanclaude.nkurunziza", "machine learning"],
  ["Dr. Sandrine Uwase", "sandrine.uwase", "health informatics"],
  ["Dr. Patrick Ishimwe", "patrick.ishimwe", "responsible AI"],
  ["Dr. Clarisse Mutesi", "clarisse.mutesi", "software architecture"],
  ["Dr. Eric Niyonzima", "eric.niyonzima", "cybersecurity"],
] as const;

const students = [
  ["Grace Iradukunda", "grace.iradukunda", "AI tools for academic writing support"],
  ["Kevin Mugisha", "kevin.mugisha", "appointment triage in district hospitals"],
  ["Diane Akimana", "diane.akimana", "early warning models for smallholder farmers"],
  ["Samuel Tuyisenge", "samuel.tuyisenge", "offline-first field data tools"],
  ["Nadia Uwamahoro", "nadia.uwamahoro", "fraud detection for mobile money agents"],
] as const;

const projectSeeds = [
  {
    title: "AI Assisted Proposal Writing for Undergraduate Research",
    slug: "ai-assisted-proposal-writing",
    abstract: "A supervised research assistant that helps final year students turn rough ideas into structured proposals.",
    problem: "Students struggle to convert early ideas into feasible proposals with clear scope, citations, and objectives.",
    keywords: ["AI writing", "research proposal", "rubrics"],
    objectives: ["Design a proposal workflow", "Evaluate AI feedback", "Measure revision time"],
    status: ProjectStatus.IN_PROGRESS,
    visibility: ProjectVisibility.DEPARTMENT,
  },
  {
    title: "Queue Prediction System for District Hospital Outpatient Clinics",
    slug: "hospital-queue-prediction",
    abstract: "A predictive dashboard that estimates patient waiting times and recommends clinic staffing adjustments.",
    problem: "Outpatient clinics lack operational data for anticipating peak periods and reducing waiting time.",
    keywords: ["health informatics", "queue prediction", "dashboards"],
    objectives: ["Collect appointment logs", "Train queue models", "Prototype an operations dashboard"],
    status: ProjectStatus.APPROVED,
    visibility: ProjectVisibility.INSTITUTION,
  },
  {
    title: "Crop Disease Early Warning Using Weather and Image Signals",
    slug: "crop-disease-early-warning",
    abstract: "A data fusion model combining weather patterns and leaf images to warn farmers about disease outbreaks.",
    problem: "Smallholder farmers receive late disease alerts, limiting prevention and reducing yield.",
    keywords: ["agritech", "computer vision", "time series"],
    objectives: ["Prepare weather datasets", "Build a risk model", "Evaluate alerts with agronomy experts"],
    status: ProjectStatus.DRAFT_PROPOSAL,
    visibility: ProjectVisibility.DEPARTMENT,
  },
  {
    title: "Offline First Field Data Collection for Community Surveys",
    slug: "offline-first-field-data-collection",
    abstract: "A mobile-first survey platform for collecting, validating, and syncing field data in low-connectivity districts.",
    problem: "Field researchers lose data quality and time when connectivity is unreliable during surveys.",
    keywords: ["offline-first", "mobile", "data collection"],
    objectives: ["Design offline sync", "Resolve conflicts", "Test with enumerators"],
    status: ProjectStatus.REVISION_REQUIRED,
    visibility: ProjectVisibility.PRIVATE,
  },
  {
    title: "Mobile Money Agent Fraud Detection with Behavioral Signals",
    slug: "mobile-money-agent-fraud-detection",
    abstract: "A fraud detection model that scores suspicious agent transactions while preserving customer privacy.",
    problem: "Mobile money providers need earlier detection of agent anomalies without exposing customer profiles.",
    keywords: ["fintech", "fraud detection", "privacy"],
    objectives: ["Model transaction patterns", "Build explainable scores", "Assess privacy risks"],
    status: ProjectStatus.IN_PROGRESS,
    visibility: ProjectVisibility.DEPARTMENT,
  },
] as const;

const sourceSeeds = [
  ["Scaffolding Undergraduate Research Writing with Generative Models", SourceType.JOURNAL_ARTICLE, "Journal of Learning Technologies", 2025],
  ["Predicting Outpatient Waiting Time in Resource Constrained Clinics", SourceType.CONFERENCE_PAPER, "African Conference on Health Informatics", 2024],
  ["East African Crop Leaf Image and Weather Dataset", SourceType.DATASET, "Open Agriculture Data Repository", 2026],
  ["Offline Data Collection Patterns for Public Sector Field Teams", SourceType.REPORT, "Digital Public Goods Technical Reports", 2023],
  ["Explainable Anomaly Detection for Mobile Money Agent Networks", SourceType.JOURNAL_ARTICLE, "Journal of Financial Cybersecurity", 2025],
] as const;

async function main() {
  await db.$transaction(async (tx) => {
    const institutions = institutionSeeds.map(([name, slug, domain], index) => ({
      id: id("institution", index),
      name,
      slug,
      domain,
      logoUrl: `https://cdn.example.edu/logos/${slug}.svg`,
    })) satisfies Prisma.InstitutionCreateManyInput[];

    const departments = departmentSeeds.map(([name, code], index) => ({
      id: id("department", index),
      institutionId: id("institution", index),
      name,
      code,
    })) satisfies Prisma.DepartmentCreateManyInput[];

    const areas = areaSeeds.map(([name, slug], index) => ({
      id: id("research_area", index),
      name,
      slug,
    })) satisfies Prisma.ResearchAreaCreateManyInput[];

    const adminUsers = [
      ["Dr. Aline Mukamana", "aline.mukamana", 0],
      ["Prof. Emmanuel Rukundo", "emmanuel.rukundo", 1],
    ] as const;

    const users = [
      ...adminUsers.map(([name, handle, departmentIndex], index) => ({
        id: id("user_admin", index),
        name,
        email: `${handle}@${institutionSeeds[departmentIndex][2]}`,
        emailVerified: true,
        image: `https://cdn.example.edu/people/admin-${index + 1}.jpg`,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        departmentId: id("department", departmentIndex),
        studentNumber: null,
        staffNumber: `ADM-2026-${day(index + 1)}`,
        bio: "Research office administrator coordinating institutional capstone workflows.",
        researchInterests: ["research governance", "academic analytics"],
        lastActiveAt: dt(7, 8 + index, "08:15:00"),
      })),
      ...supervisors.map(([name, handle, interest], index) => ({
        id: id("user_supervisor", index),
        name,
        email: `${handle}@${institutionSeeds[index][2]}`,
        emailVerified: true,
        image: `https://cdn.example.edu/people/supervisor-${index + 1}.jpg`,
        role: UserRole.SUPERVISOR,
        status: UserStatus.ACTIVE,
        departmentId: id("department", index),
        studentNumber: null,
        staffNumber: `STF-2026-${String(index + 101).padStart(3, "0")}`,
        bio: `Senior lecturer supervising final year projects in ${interest}.`,
        researchInterests: [interest, "student supervision"],
        lastActiveAt: dt(7, 5 + index, "09:20:00"),
      })),
      ...students.map(([name, handle, focus], index) => ({
        id: id("user_student", index),
        name,
        email: `${handle}@student.${institutionSeeds[index][2]}`,
        emailVerified: true,
        image: `https://cdn.example.edu/people/student-${index + 1}.jpg`,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        departmentId: id("department", index),
        studentNumber: `STU-2026-${String(index + 1).padStart(4, "0")}`,
        staffNumber: null,
        bio: `Final year student researching ${focus}.`,
        researchInterests: [focus, areaSeeds[index][0]],
        lastActiveAt: dt(7, 5 + index, "10:05:00"),
      })),
    ] satisfies Prisma.UserCreateManyInput[];

    await tx.institution.createMany({ data: institutions, skipDuplicates: true });
    await tx.department.createMany({ data: departments, skipDuplicates: true });
    await tx.researchArea.createMany({ data: areas, skipDuplicates: true });
    await tx.user.createMany({ data: users, skipDuplicates: true });

    await Promise.all(
      departments.map((department, index) =>
        tx.department.updateMany({
          where: { id: department.id },
          data: { headId: id("user_supervisor", index) },
        }),
      ),
    );

    await tx.session.createMany({
      data: users.slice(0, 5).map((user, index) => ({
        id: id("session", index),
        token: `seed-session-token-${index + 1}`,
        userId: user.id,
        expiresAt: dt(8, 10 + index),
        ipAddress: `10.42.0.${10 + index}`,
        userAgent: "Mozilla/5.0 Chrome/126.0 Seed Browser",
      })),
      skipDuplicates: true,
    });

    await tx.account.createMany({
      data: users.slice(0, 5).map((user, index) => ({
        id: id("account", index),
        accountId: user.email,
        providerId: "credential",
        userId: user.id,
        password: `seeded-password-hash-${index + 1}`,
        scope: "email profile",
      })),
      skipDuplicates: true,
    });

    await tx.verification.createMany({
      data: students.map((student, index) => ({
        id: id("verification", index),
        identifier: `${student[1]}@student.${institutionSeeds[index][2]}`,
        value: `seed-email-verification-${index + 1}`,
        expiresAt: dt(7, 20 + index),
      })),
      skipDuplicates: true,
    });

    const projects = projectSeeds.map((project, index) => ({
      id: id("project", index),
      departmentId: id("department", index),
      ownerId: id("user_student", index),
      supervisorId: id("user_supervisor", index),
      title: project.title,
      slug: project.slug,
      abstract: project.abstract,
      problemStatement: project.problem,
      objectives: [...project.objectives],
      keywords: [...project.keywords],
      status: project.status,
      visibility: project.visibility,
      startedAt: dt(2, 3 + index, "08:00:00"),
      approvedAt: index === 2 ? null : dt(3, 14 + index, "08:00:00"),
      defenseAt: dt(8, 22 + index, "09:00:00"),
    })) satisfies Prisma.ProjectCreateManyInput[];

    await tx.project.createMany({ data: projects, skipDuplicates: true });

    await tx.projectResearchArea.createMany({
      data: projects.map((project, index) => ({
        id: id("project_research_area", index),
        projectId: project.id,
        researchAreaId: id("research_area", index),
      })),
      skipDuplicates: true,
    });

    await tx.projectMember.createMany({
      data: projects.map((project, index) => ({
        id: id("project_member", index),
        projectId: project.id,
        userId: project.ownerId,
        role: ProjectMemberRole.OWNER,
        invitedById: project.supervisorId,
        joinedAt: dt(3, 5 + index, "09:00:00"),
      })),
      skipDuplicates: true,
    });

    const milestones = projects.map((project, index) => ({
      id: id("project_milestone", index),
      projectId: project.id,
      createdById: project.supervisorId,
      title: ["Proposal Approval", "Literature Review Submission", "Dataset Preparation", "Implementation Review", "Final Defense Readiness"][index],
      description: "Supervisor-created milestone for final year research delivery.",
      type: [MilestoneType.PROPOSAL, MilestoneType.LITERATURE_REVIEW, MilestoneType.IMPLEMENTATION, MilestoneType.PROGRESS_REPORT, MilestoneType.DEFENSE][index],
      status: [MilestoneStatus.APPROVED, MilestoneStatus.SUBMITTED, MilestoneStatus.IN_PROGRESS, MilestoneStatus.CHANGES_REQUESTED, MilestoneStatus.NOT_STARTED][index],
      dueAt: dt(7, 14 + index, "15:00:00"),
      completedAt: index < 2 ? dt(7, 1 + index, "15:00:00") : null,
    })) satisfies Prisma.ProjectMilestoneCreateManyInput[];

    await tx.projectMilestone.createMany({ data: milestones, skipDuplicates: true });

    const submissions = projects.map((project, index) => ({
      id: id("submission", index),
      projectId: project.id,
      milestoneId: id("project_milestone", index),
      submittedById: project.ownerId,
      title: `${project.title} - Milestone ${index + 1} Submission`,
      notes: "Submitted with updated problem statement, method justification, and supervisor response notes.",
      status: [SubmissionStatus.ACCEPTED, SubmissionStatus.UNDER_REVIEW, SubmissionStatus.SUBMITTED, SubmissionStatus.CHANGES_REQUESTED, SubmissionStatus.DRAFT][index],
      submittedAt: dt(7, 2 + index, "10:30:00"),
    })) satisfies Prisma.SubmissionCreateManyInput[];

    await tx.submission.createMany({ data: submissions, skipDuplicates: true });

    const documents = projects.map((project, index) => ({
      id: id("research_document", index),
      projectId: project.id,
      createdById: project.ownerId,
      title: `${project.title} Working Document`,
      type: [DocumentType.PROPOSAL, DocumentType.LITERATURE_REVIEW, DocumentType.METHODOLOGY, DocumentType.IMPLEMENTATION_NOTE, DocumentType.FINAL_REPORT][index],
      status: [DocumentStatus.APPROVED, DocumentStatus.IN_REVIEW, DocumentStatus.DRAFT, DocumentStatus.IN_REVIEW, DocumentStatus.DRAFT][index],
      content: "Active research draft with citations, supervisor responses, methodology notes, and implementation evidence.",
      wordCount: [4250, 5100, 3800, 4650, 5900][index],
      publishedAt: index === 0 ? dt(7, 1, "09:30:00") : null,
    })) satisfies Prisma.ResearchDocumentCreateManyInput[];

    await tx.researchDocument.createMany({ data: documents, skipDuplicates: true });

    await tx.documentVersion.createMany({
      data: documents.map((document, index) => ({
        id: id("document_version", index),
        documentId: document.id,
        createdById: document.createdById,
        version: 1,
        title: `${document.title} v1`,
        content: document.content,
        changeNote: "Initial structured draft imported into the research workspace.",
      })),
      skipDuplicates: true,
    });

    const uploads = projects.map((project, index) => ({
      id: id("uploaded_file", index),
      projectId: project.id,
      documentId: id("research_document", index),
      submissionId: id("submission", index),
      uploadedById: project.ownerId,
      key: `seed/projects/${project.id}/artifact-${index + 1}.pdf`,
      url: `https://cdn.example.edu/seed/projects/${project.id}/artifact-${index + 1}.pdf`,
      name: `research-artifact-${index + 1}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 1_200_000 + index * 125_000,
      checksum: `sha256:seed-checksum-${index + 1}`,
    })) satisfies Prisma.UploadedFileCreateManyInput[];

    await tx.uploadedFile.createMany({ data: uploads, skipDuplicates: true });

    await tx.feedback.createMany({
      data: projects.map((project, index) => ({
        id: id("feedback", index),
        projectId: project.id,
        submissionId: id("submission", index),
        documentId: id("research_document", index),
        authorId: project.supervisorId,
        body: "Tighten the evaluation metrics, add recent literature, and make the implementation risks explicit.",
        resolvedAt: index < 2 ? dt(7, 7 + index, "14:00:00") : null,
      })),
      skipDuplicates: true,
    });

    const sources = sourceSeeds.map(([title, type, venue, year], index) => ({
      id: id("literature_source", index),
      departmentId: id("department", index),
      createdById: id("user_student", index),
      type,
      title,
      abstract: `A realistic source used by students researching ${areaSeeds[index][0].toLowerCase()}.`,
      authors: [students[index][0], supervisors[index][0]],
      venue,
      publisher: "Academic Digital Press",
      year,
      doi: `10.5555/seed.${year}.${String(index + 1).padStart(3, "0")}`,
      url: `https://doi.org/10.5555/seed.${year}.${String(index + 1).padStart(3, "0")}`,
      pdfUrl: `https://papers.example.edu/seed-${index + 1}.pdf`,
      citation: `${students[index][0]} & ${supervisors[index][0]} (${year}). ${title}.`,
      metadata: { seeded: true, evidenceLevel: index < 2 ? "high" : "moderate" },
    })) satisfies Prisma.LiteratureSourceCreateManyInput[];

    await tx.literatureSource.createMany({ data: sources, skipDuplicates: true });

    await tx.sourceResearchArea.createMany({
      data: sources.map((source, index) => ({
        id: id("source_research_area", index),
        sourceId: source.id,
        researchAreaId: id("research_area", index),
      })),
      skipDuplicates: true,
    });

    const projectSources = projects.map((project, index) => ({
      id: id("project_source", index),
      projectId: project.id,
      sourceId: id("literature_source", index),
      status: [CitationStatus.CITED, CitationStatus.REVIEWED, CitationStatus.READING, CitationStatus.TO_READ, CitationStatus.CITED][index],
      relevance: [95, 88, 91, 84, 93][index],
      notes: "Core source selected because it closely matches the project method and evaluation context.",
      addedAt: dt(4, 3 + index, "11:00:00"),
    })) satisfies Prisma.ProjectSourceCreateManyInput[];

    await tx.projectSource.createMany({ data: projectSources, skipDuplicates: true });

    await tx.literatureNote.createMany({
      data: projectSources.map((source, index) => ({
        id: id("literature_note", index),
        projectSourceId: source.id,
        authorId: id("user_student", index),
        quote: "Structured feedback is most useful when traceable to a clear assessment criterion.",
        note: "Use this source to justify the evaluation design and measurable project outcomes.",
        page: `${12 + index}`,
      })),
      skipDuplicates: true,
    });

    const knowledgeDocuments = sources.map((source, index) => ({
      id: id("knowledge_document", index),
      departmentId: source.departmentId,
      sourceId: source.id,
      uploadedFileId: id("uploaded_file", index),
      title: `${source.title} Indexed Text`,
      textHash: `seed-text-hash-${index + 1}`,
      tokenCount: 2400 + index * 180,
      metadata: { sourceTitle: source.title, ingestionPipeline: "seed", language: "en" },
      indexedAt: dt(6, 10 + index, "08:00:00"),
    })) satisfies Prisma.KnowledgeDocumentCreateManyInput[];

    await tx.knowledgeDocument.createMany({ data: knowledgeDocuments, skipDuplicates: true });

    await tx.knowledgeChunk.createMany({
      data: knowledgeDocuments.map((document, index) => ({
        id: id("knowledge_chunk", index),
        knowledgeDocumentId: document.id,
        chunkIndex: 0,
        content: "The study frames the research problem, related work, methodology, evaluation measures, and limitations.",
        tokenCount: 128 + index * 12,
        vectorId: `seed-vector-${index + 1}`,
        metadata: { pageStart: 1, pageEnd: 2, chunkSize: 512 },
      })),
      skipDuplicates: true,
    });

    const conversations = projects.map((project, index) => ({
      id: id("ai_conversation", index),
      projectId: project.id,
      userId: project.ownerId,
      title: `${project.title} AI Research Assistant Chat`,
    })) satisfies Prisma.AiConversationCreateManyInput[];

    await tx.aiConversation.createMany({ data: conversations, skipDuplicates: true });

    await tx.aiMessage.createMany({
      data: conversations.flatMap((conversation, index) => [
        {
          id: `${id("ai_message", index)}_user`,
          conversationId: conversation.id,
          authorId: conversation.userId,
          role: "user",
          content: "Help me improve the research objectives and identify the weakest part of my methodology.",
          citations: Prisma.JsonNull,
        },
        {
          id: `${id("ai_message", index)}_assistant`,
          conversationId: conversation.id,
          authorId: null,
          role: "assistant",
          content: "Make each objective measurable, then align the evaluation section with data you can realistically collect.",
          citations: [{ sourceId: id("literature_source", index), page: 12 }],
        },
      ]),
      skipDuplicates: true,
    });

    await tx.aiJob.createMany({
      data: projects.map((project, index) => ({
        id: id("ai_job", index),
        projectId: project.id,
        requestedById: project.ownerId,
        type: [AiJobType.PROPOSAL_DRAFT, AiJobType.LITERATURE_SEARCH, AiJobType.RAG_INGESTION, AiJobType.DOCUMENT_SUMMARY, AiJobType.DEFENSE_PREP][index],
        status: [AiJobStatus.SUCCEEDED, AiJobStatus.RUNNING, AiJobStatus.QUEUED, AiJobStatus.SUCCEEDED, AiJobStatus.FAILED][index],
        input: { projectId: project.id, prompt: "Prepare context-aware research assistance for the student." },
        output: index === 4 ? Prisma.JsonNull : { summary: "Generated structured suggestions with citations and next steps." },
        error: index === 4 ? "Seeded example failure for retry UI testing." : null,
        startedAt: index === 2 ? null : dt(7, 4 + index, "08:00:00"),
        completedAt: index === 0 || index === 3 ? dt(7, 4 + index, "08:04:00") : null,
      })),
      skipDuplicates: true,
    });

    const tasks = projects.map((project, index) => ({
      id: id("research_task", index),
      projectId: project.id,
      milestoneId: id("project_milestone", index),
      createdById: project.supervisorId,
      title: ["Revise proposal objectives", "Annotate latest literature sources", "Clean dataset schema", "Prepare implementation demo", "Draft defense responses"][index],
      description: "Task assigned during supervision to move the project toward the next milestone.",
      status: [TaskStatus.IN_PROGRESS, TaskStatus.TODO, TaskStatus.BLOCKED, TaskStatus.IN_REVIEW, TaskStatus.TODO][index],
      priority: [TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM][index],
      dueAt: dt(7, 16 + index, "17:00:00"),
      completedAt: null,
    })) satisfies Prisma.ResearchTaskCreateManyInput[];

    await tx.researchTask.createMany({ data: tasks, skipDuplicates: true });

    await tx.taskAssignee.createMany({
      data: tasks.map((task, index) => ({
        id: id("task_assignee", index),
        taskId: task.id,
        userId: id("user_student", index),
      })),
      skipDuplicates: true,
    });

    await tx.comment.createMany({
      data: projects.map((project, index) => ({
        id: id("comment", index),
        projectId: project.id,
        documentId: id("research_document", index),
        taskId: id("research_task", index),
        milestoneId: id("project_milestone", index),
        authorId: project.supervisorId,
        parentId: null,
        body: "Connect this section more directly to the research question and cite the primary source summarized.",
        resolvedAt: index === 0 ? dt(7, 9, "09:30:00") : null,
      })),
      skipDuplicates: true,
    });

    const meetings = projects.map((project, index) => ({
      id: id("meeting", index),
      projectId: project.id,
      createdById: project.supervisorId,
      title: `${project.title} Supervision Meeting`,
      agenda: "Review milestone status, unresolved feedback, next tasks, and defense risks.",
      notes: "Student should submit an updated document version before the next checkpoint.",
      startsAt: dt(7, 11 + index, "09:00:00"),
      endsAt: dt(7, 11 + index, "09:45:00"),
      status: [MeetingStatus.COMPLETED, MeetingStatus.SCHEDULED, MeetingStatus.SCHEDULED, MeetingStatus.COMPLETED, MeetingStatus.SCHEDULED][index],
      meetingUrl: `https://meet.example.edu/research/seed-${index + 1}`,
    })) satisfies Prisma.MeetingCreateManyInput[];

    await tx.meeting.createMany({ data: meetings, skipDuplicates: true });

    await tx.meetingAttendee.createMany({
      data: meetings.map((meeting, index) => ({
        id: id("meeting_attendee", index),
        meetingId: meeting.id,
        userId: id("user_student", index),
        attended: index === 0 || index === 3,
      })),
      skipDuplicates: true,
    });

    const rubrics = departments.map((department, index) => ({
      id: id("rubric", index),
      institutionId: department.institutionId,
      departmentId: department.id,
      createdById: index < 2 ? id("user_admin", index) : id("user_admin", 0),
      name: ["Final Year Proposal Rubric", "Literature Review Rubric", "Implementation Demo Rubric", "Progress Report Rubric", "Final Defense Rubric"][index],
      description: "Department assessment rubric used by supervisors and defense panels.",
      isDefault: index === 0,
    })) satisfies Prisma.RubricCreateManyInput[];

    await tx.rubric.createMany({ data: rubrics, skipDuplicates: true });

    const criteria = rubrics.map((rubric, index) => ({
      id: id("rubric_criterion", index),
      rubricId: rubric.id,
      name: ["Problem clarity", "Literature synthesis", "Methodological rigor", "Implementation quality", "Defense readiness"][index],
      description: "Measures research maturity and evidence-backed decision making.",
      maxScore: decimal("20.00"),
      weight: decimal("20.00"),
      position: index + 1,
    })) satisfies Prisma.RubricCriterionCreateManyInput[];

    await tx.rubricCriterion.createMany({ data: criteria, skipDuplicates: true });

    const evaluations = projects.map((project, index) => ({
      id: id("evaluation", index),
      projectId: project.id,
      submissionId: id("submission", index),
      rubricId: id("rubric", index),
      evaluatorId: project.supervisorId,
      status: [EvaluationStatus.FINALIZED, EvaluationStatus.SUBMITTED, EvaluationStatus.DRAFT, EvaluationStatus.SUBMITTED, EvaluationStatus.DRAFT][index],
      totalScore: index < 2 ? decimal(`${78 + index * 4}.50`) : null,
      summary: "Solid progress with remaining work needed on validation, limitations, and citation depth.",
      submittedAt: index < 2 ? dt(7, 5 + index, "16:00:00") : null,
    })) satisfies Prisma.EvaluationCreateManyInput[];

    await tx.evaluation.createMany({ data: evaluations, skipDuplicates: true });

    await tx.evaluationScore.createMany({
      data: evaluations.map((evaluation, index) => ({
        id: id("evaluation_score", index),
        evaluationId: evaluation.id,
        criterionId: id("rubric_criterion", index),
        score: decimal(`${14 + index}.50`),
        comment: "Evidence is adequate for this stage, with assumptions and limitations needing clearer wording.",
      })),
      skipDuplicates: true,
    });

    const defenses = projects.map((project, index) => ({
      id: id("defense_session", index),
      projectId: project.id,
      chairId: index < 2 ? id("user_admin", index) : id("user_admin", 0),
      status: [DefenseStatus.SCHEDULED, DefenseStatus.SCHEDULED, DefenseStatus.POSTPONED, DefenseStatus.SCHEDULED, DefenseStatus.SCHEDULED][index],
      venue: `Innovation Lab ${index + 1}`,
      meetingUrl: `https://meet.example.edu/defense/seed-${index + 1}`,
      scheduledAt: dt(8, 22 + index, "09:00:00"),
      resultNotes: index === 2 ? "Postponed while the dataset approval letter is updated." : null,
    })) satisfies Prisma.DefenseSessionCreateManyInput[];

    await tx.defenseSession.createMany({ data: defenses, skipDuplicates: true });

    await tx.defenseCommitteeMember.createMany({
      data: defenses.map((defense, index) => ({
        id: id("defense_committee_member", index),
        defenseSessionId: defense.id,
        userId: id("user_supervisor", index),
        role: index === 0 ? "External Examiner" : "Panel Member",
      })),
      skipDuplicates: true,
    });

    await tx.notification.createMany({
      data: projects.map((project, index) => ({
        id: id("notification", index),
        userId: project.ownerId,
        departmentId: project.departmentId,
        channel: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SOCKET, NotificationChannel.IN_APP, NotificationChannel.EMAIL][index],
        status: index < 2 ? NotificationStatus.READ : NotificationStatus.UNREAD,
        title: ["Supervisor feedback added", "Literature review deadline approaching", "AI ingestion completed", "Implementation task requires changes", "Defense schedule published"][index],
        body: "Open your research workspace to review the latest update and respond before the next checkpoint.",
        actionUrl: `/student/projects/${project.id}`,
        metadata: { projectId: project.id, category: "research-workflow" },
        readAt: index < 2 ? dt(7, 8 + index, "08:00:00") : null,
      })),
      skipDuplicates: true,
    });

    await tx.repositoryRecord.createMany({
      data: projects.map((project, index) => ({
        id: id("repository_record", index),
        institutionId: id("institution", index),
        departmentId: project.departmentId,
        projectId: project.id,
        createdById: project.supervisorId,
        type: [RepositoryRecordType.PAST_PROJECT, RepositoryRecordType.RESEARCH_PAPER, RepositoryRecordType.DATASET, RepositoryRecordType.CAPSTONE_REPORT, RepositoryRecordType.CODE_REPOSITORY][index],
        title: project.title,
        abstract: project.abstract,
        authors: [students[index][0], supervisors[index][0]],
        year: 2026,
        technologies: [["Next.js", "Gemini", "PostgreSQL"], ["Python", "XGBoost", "Power BI"], ["PyTorch", "PostGIS", "FastAPI"], ["React Native", "SQLite", "PostgreSQL"], ["Python", "Scikit-learn", "Kafka"]][index],
        supervisorName: supervisors[index][0],
        fileUrl: `https://repository.example.edu/records/seed-${index + 1}.pdf`,
        externalUrl: `https://repository.example.edu/projects/${project.slug}`,
        metadata: { departmentId: project.departmentId, visibility: project.visibility },
        publishedAt: index < 2 ? dt(6, 18 + index, "08:00:00") : null,
      })),
      skipDuplicates: true,
    });

    await tx.activityLog.createMany({
      data: projects.map((project, index) => ({
        id: id("activity_log", index),
        actorId: project.ownerId,
        departmentId: project.departmentId,
        projectId: project.id,
        action: ["project.created", "submission.reviewed", "source.indexed", "task.updated", "defense.scheduled"][index],
        entityType: ["Project", "Submission", "KnowledgeDocument", "ResearchTask", "DefenseSession"][index],
        entityId: [project.id, id("submission", index), id("knowledge_document", index), id("research_task", index), id("defense_session", index)][index],
        metadata: { seeded: true, recordedAt: "2026-07-09T12:00:00.000Z" },
      })),
      skipDuplicates: true,
    });
  }, {
    maxWait: 50000, // Maximum time to wait for a connection
    timeout: 300000, // Maximum time (in ms) the transaction can run
  });

  console.log("Seeded at least five realistic records in every Prisma table.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

