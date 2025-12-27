# What-If Storytelling Simulator

## Executive Summary

Build a prototype "What If" storytelling simulator that converts simple inputs (character, setting, event, constraints) into structured, branching narratives. The app enables fast idea generation, branchable story graphs, dual-perspective comparison, and exportable timelines. 

The Simulator combines:
- **Deterministic logical rules** for grounded, plausible scenarios
- **Creative algorithms** (heuristic/ML-assisted) for high-surprise, diverse prompts

### Primary Deliverable
A complete specification including app flow, data model, API design, and algorithmic implementation for developers to build a working prototype.

## Goals & Success Metrics

### Goals
- Produce 5–10 usable, diverse "what if" prompts from 3–5 input parameters
- Enable branching graphs with minimum depth of 4 and branching factor of 2–4
- Support dual-perspective synchronization for aligned scenes
- Provide modular Simulator service (rule-based + optional ML augmentation)
- 
### Success Metrics (Prototype)
| Metric | Target |
|--------|--------|
| Prompt acceptance rate | ≥70% of generated prompts accepted or edited |
| Branch diversity | Mean semantic distance > threshold (embedding cosine) |
| Reader retention | % completing at least one timeline |


## Variable Input Parameters

The Simulator accepts flexible input parameters, filling missing slots with defaults or random seeds.

### Core Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `character` | Name + trait list (max 3) | `{name: "Maya", traits: ["curious", "impulsive", "pragmatic"]}` |
| `setting` | Time + place + mood | `{era: "near-future", place: "coastal megacity", mood: "nocturnal"}` |
| `event` | Inciting incident | `"a blackout cancels the citywide festival"` |
| `genre` | Story category | mystery, sci-fi, slice-of-life, historical, horror |
| `tone` | Emotional flavor | whimsical, bleak, humorous, tense |
| `constraints` | Story limits | length target, vocabulary level, content filters, educational goals |

### Optional Parameters

| Parameter | Options | Purpose |
|-----------|---------|---------|
| `perspective` | single \| dual \| multiple | Determines narrator viewpoint |
| `branch_density` | low \| medium \| high | Controls branch suggestions per node |
| `theme_keywords` | Array of strings | Thematic focus areas |
| `audience_age` | Age ranges | Content appropriateness (10-12, 13-17, 18+) |

### Parameter Handling Rules

1. **All parameters optional** - UI provides "quick starter" defaults
2. **Input normalization** - Canonicalize genres, map synonyms ("SF" → "sci-fi")
3. **Parameter precedence**: User-specified > Template defaults > Random seed

## Dynamic "What If" Question Generation

The Simulator employs two cooperating subsystems that work together to generate diverse, high-quality prompts:

1. **Logical Generator** - Deterministic, rule-based transformations for plausible scenario variants
2. **Creative Generator** - Heuristic or ML-assisted generation for high-surprise, high-variance prompts

### Output Format
The system produces a **ranked list** of candidate "What if" prompts (default: 6), each containing:
- Type tags (logical, twist, character, thematic)
- Estimated impact score  
- Editing affordance for user customization

### 4.1 Logical Generator (Rules & Templates)

**Purpose**: Create grounded, plausible alternate scenarios that preserve internal story logic.

#### Core Techniques

| Technique | Description | Example |
|-----------|-------------|---------|
| **Slot Permutation** | Swap/modify parameter slots | `"Mayor canceled festival"` → `"Festival continued, mayor vanished"` |
| **Constraint Inversion** | Negate constraints | allowed → forbidden, public → private |
| **Causal Branching** | Map event consequences | event → scientific/social/personal outcomes |
| **Role Reversal** | Swap character roles | protagonist ↔ antagonist, leader ↔ follower |
| **Temporal Displacement** | Shift timing/era | Move event earlier/later, transpose historical period |

#### Implementation Architecture

```
Templates: Pattern/Slot pairs
Pattern Language: IF <slot:event> THEN <consequence:template> | modifiers

Consequence Categories (domain-agnostic):
- investigate, exploit, ignore, misunderstand, escalate, reconcile
```

### 4.2 Creative Generator (Heuristics + LLM)

**Purpose**: Generate surprising, emotionally resonant prompts that break conventional associations.

#### Advanced Techniques

| Technique | Method | Example Use Case |
|-----------|--------|------------------|
| **Concept Blending** | Combine distant concepts | "tax policy" + "dreamscape" |
| **Anti-Templates** | Violate genre expectations | Comedic twist in horror setup |
| **Character Micro-Conflict** | Internal trait contradictions | Curious-but-risk-averse acts boldly |
| **Associative Chain Sampling** | Word embeddings/LLM seeds | Unusual continuation proposals |

#### LLM Integration (Optional)

- **Input**: Constrained prompts with system instructions + few-shot examples
- **Processing**: Request 6 what-if variants from LLM
- **Post-processing**: Safety filters + structural normalizer for brevity/alignment

### 4.3 Ranking & Diversity Algorithm

#### Composite Scoring Formula
```
final_score = relevance_score × (1 + novelty_bonus) - safety_penalty
```

#### Scoring Components

| Component | Measurement Method |
|-----------|-------------------|
| **Relevance** | Semantic similarity (embedding cosine) between input and candidate |
| **Novelty** | Distance from previously generated candidates (maximize pairwise distances) |
| **Safety** | Penalty for flagged content or high-risk suggestions |

#### User Control Modes
- **Logical**: Focus on rule-based, plausible scenarios
- **Creative**: Emphasize surprising, unconventional prompts  
- **Balanced**: Optimal mix of both approaches

## Branch Suggestion Algorithms

Generate contextual branch suggestions that expand story paths from existing nodes.

### Branch Type Categories

| Branch Type | Purpose | Example Trigger |
|-------------|---------|-----------------|
| **Character-driven** | Choices reflecting character traits | Skeptical character questions evidence |
| **Plot-twist** | Unexpected information/reversal | Hidden identity revelation |
| **Moral-dilemma** | Ethical choice points | Save one vs. save many scenario |
| **Procedural/Investigation** | Step-by-step problem solving | Gather clues, interview witnesses |
| **Escalation/De-escalation** | Amplify or mitigate conflict | Confrontation vs. negotiation |

### Core Algorithm

```python
def generate_branch_suggestions(node_content, story_params, branch_density):
    candidates = []
    
    # 1. Extract story elements using NLP
    entities = extract_entities(node_content)        # NER processing
    actions = extract_actions(node_content)          # Dependency parsing
    
    # 2. Generate candidates for each branch type
    for branch_type in selected_branch_types:
        candidate = fill_template(
            branch_type, entities, actions, story_params
        )
        candidates.append(candidate)
    
    # 3. Creative augmentation (optional)
    if creative_mode:
        llm_candidates = generate_llm_branches(node_content, story_params)
        candidates.extend(llm_candidates)
    
    # 4. Rank by composite score
    ranked_candidates = rank_by_score(candidates, relevance, novelty, impact)
    
    # 5. Return top N based on branch density setting
    return ranked_candidates[:get_branch_limit(branch_density)]
```

### Quality Control Mechanisms

| Control | Implementation |
|---------|----------------|
| **Coherence Checks** | No unexplained magic unless genre permits |
| **Trivial Branch Filter** | Avoid "do nothing" options unless explicitly requested |
| **Branching Budget** | Per-story limits to prevent exponential explosion (configurable) |

## Dual Perspectives & Synchronization

Enable multiple viewpoint storytelling with synchronized narrative events.

### Data Model Extensions

| Field | Type | Purpose |
|-------|------|---------|
| `sync_id` | String | Links nodes representing same event across perspectives |
| `offset` | Number (optional) | Manages differing chronological order |

### UI Behavior

#### Split View Features
- **Synchronized scrolling** when `sync_id` matches between perspectives
- **Timeline alignment overlay** highlighting matched events across viewpoints
- **Visual connection indicators** showing cross-perspective relationships

### Generation Rules for Dual Mode

The Simulator provides **paired branch suggestions**:

1. **Perspective-specific branches** - One set for each point of view
2. **Cross-impact branches** - Actions in POV A that affect POV B
3. **Convergence points** - Branches that bring perspectives together

## API Endpoints

### Core Simulator API

#### Generate Story Prompts
```http
POST /api/v1/simulator/generatePrompt
```

**Request**
```json
{
  "character": {...},      // Optional
  "setting": {...},        // Optional  
  "event": "string",       // Optional
  "genre": "string",       // Optional
  "tone": "string",        // Optional
  "constraints": {...},    // Optional
  "mode": "logical|creative|balanced"  // Optional
}
```

**Response**
```json
[
  {
    "id": "prompt_123",
    "prompt_text": "What if...",
    "type": "logical|creative|twist|character|thematic",
    "tags": ["mystery", "urban"],
    "impact": 0.85,
    "confidence_score": 0.92
  }
]
```

#### Suggest Story Branches
```http
POST /api/v1/simulator/suggestBranches
```

**Request**
```json
{
  "story_id": "story_456",
  "node_id": "node_789", 
  "branch_density": "low|medium|high",
  "mode": "logical|creative|balanced"
}
```

**Response**
```json
[
  {
    "id": "branch_101",
    "branch_text": "Investigate the mysterious signal",
    "branch_type": "procedural",
    "impact_score": 0.78,
    "estimated_outcome_summary": "Discovery of hidden technology"
  }
]
```

#### LLM Augmentation (Premium)
```http
POST /api/v1/simulator/augmentLLM
```

**Request**
```json
{
  "seed_text": "The city woke without shadows...",
  "constraints": {...},
  "safety_filters": ["violence", "adult_content"]
}
```

**Response**
```json
{
  "variants": [
    {
      "text": "Enhanced creative variant...",
      "confidence": 0.87
    }
  ]
}
```

### Explainability Metadata

All API responses include `explainability` information:
- **Rule-based results**: Which template/rule generated the candidate
- **LLM results**: Which few-shot examples influenced the generation

## JSON Schema (Story Graph)

### Story Data Structure

```json
{
  "story": {
    "id": "string",
    "title": "string", 
    "root_node_id": "node_1",
    "metadata": {
      "created_at": "2023-10-25T10:00:00Z",
      "author_id": "user_123",
      "genre": "mystery",
      "tone": "tense"
    },
    "nodes": [
      {
        "id": "node_1",
        "content": "The city woke up without shadows.",
        "author_id": "user_1", 
        "created_at": "2023-10-25T10:00:00Z",
        "metadata": {
          "sync_id": null,
          "age_rating": "12+",
          "word_count": 7
        }
      }
    ],
    "branches": [
      {
        "id": "branch_1",
        "from": "node_1",
        "to": "node_2", 
        "label": "Investigate",
        "type": "procedural",
        "metadata": {
          "impact_score": 0.78,
          "selection_count": 0
        }
      }
    ]
  }
}
```

## UI Design Specifications

### Prompt Lab Interface

| Component | Layout | Functionality |
|-----------|--------|---------------|
| **Parameter Form** | Left panel | Input fields for character, setting, event, genre, tone, constraints |
| **Generator Results** | Right panel | Ranked prompts with type tags and `Apply` buttons |
| **Action Bar** | Bottom | Inline edit, save-as-template, add-to-story actions |

### Node Editor + Simulator Panel

| Component | Behavior |
|-----------|----------|
| **Main Editor** | Shows current node content with editing capabilities |
| **Simulator Side Panel** | Displays suggested branches with `Regenerate` toggle |
| **Branch Preview** | Hover tooltips showing 1-2 sentence continuations |
| **Branch Actions** | Apply, edit, or dismiss suggested branches |

## Implementation Roadmap

### Phase 1: MVP (Minimum Viable Product)

| Component | Implementation |
|-----------|----------------|
| **Logical Generator** | Templates + slot-filling system (fast, predictable) |
| **Branch Suggestions** | NER + dependency parsing + template matching |
| **Dual Perspectives** | Paired nodes with `sync_id` implementation |
| **Basic UI** | Parameter forms, node editor, branch suggestions |

### Phase 2: Enhanced Features

| Component | Enhancement |
|-----------|-------------|
| **Creative Generator** | LLM endpoint integration for richer variants |
| **Advanced Ranking** | Embedding-based relevance/novelty scoring (sentence-transformers) |
| **Analytics Dashboard** | Branch selection heatmaps, diversity metrics |
| **Export Features** | Timeline generation, story sharing |

### Technical Trade-offs

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Rule-based** | Predictable, fast, controllable | Less surprising, limited creativity | Educational use cases, consistent output |
| **LLM-based** | Highly creative, contextually rich | Cost, latency, safety complexity | Creative writing, diverse narratives |

## Safety & Content Moderation

### Content Filtering Pipeline

1. **Pre-generation Filtering**
   - Safety classifier screening (toxicity, sexual content, hate speech)
   - Age-appropriateness filters based on target audience
   - Genre-specific content guidelines

2. **Post-generation Review**
   - Automated content scoring
   - Flagging system for manual review
   - User reporting mechanisms

3. **Human Moderation Queue**
   - Escalation workflow for ambiguous cases
   - Community guidelines enforcement
   - Appeal process for disputed content

## Testing Strategy

### Test Categories

| Test Type | Purpose | Success Criteria |
|-----------|---------|-------------------|
| **Unit Tests** | Template and slot-filler validation | Each template produces valid output |
| **Property Tests** | Generator robustness | Valid variant for every parameter combination |
| **Diversity Tests** | Content variety measurement | Average embedding distance > threshold |
| **Safety Tests** | Content moderation validation | No high-severity flags for target audience |

### Quality Metrics

- **Prompt Acceptance Rate**: ≥70% user acceptance/editing
- **Response Time**: <2 seconds for logical generation, <5 seconds for creative
- **Safety Score**: <1% false positive rate for content filtering

## Example User Flow

### Sample Input Parameters

```json
{
  "character": {
    "name": "Asha", 
    "traits": ["skeptical", "curious"]
  },
  "setting": "mountain town, winter",
  "event": "a letter arrives with no return address",
  "genre": "mystery",
  "mode": "balanced"
}
```

### Generated Prompt Examples

| Rank | Type | Generated Prompt | Category |
|------|------|------------------|----------|
| 1 | **Logical** | "What if the letter contained coordinates leading to a buried time capsail?" | Procedural |
| 2 | **Creative** | "What if the letter was written by Asha from an alternate present where she never left town?" | Character-contradiction |
| 3 | **Thematic** | "What if the letter accused Asha of a crime she doesn't remember?" | Moral-dilemma |

### User Actions
Each generated prompt includes:
- **Apply** button to seed new story/branch
- **Edit** option for customization
- **Save as Template** for reuse

## Project Deliverables

### Core Components

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| **Simulator Service** | Rule-based engine + API endpoints | High |
| **Frontend Components** | Prompt Lab, Simulator Panel, Branch Preview | High |
| **Data Schemas** | JSON specifications for all data structures | High |
| **Template Library** | Rule-based templates across genres | Medium |
| **Test Suite** | Unit tests, integration tests, example test cases | High |
| **Documentation** | API docs, developer guides, user manuals | Medium |

### Optional Enhancements

- LLM integration service
- Analytics dashboard
- Export/import functionality
- Multi-language support

## Future Development Options

Choose any combination for next phase development:

### Option A: Enhanced Schema Design
- Complete JSON schema specification for all data structures
- Validation rules and constraints
- Migration strategies for data updates

### Option B: Template Library Expansion  
- 30+ rule-based templates across genres
- Template testing and validation
- Template customization interface

### Option C: LLM Integration Framework
- System prompt engineering
- Few-shot example library
- Safety and filtering pipelines

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

#### Stories Table
```sql
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    root_node_id UUID,
    genre VARCHAR(50),
    tone VARCHAR(50),
    audience_age VARCHAR(20),
    is_public BOOLEAN DEFAULT false,
    is_collaborative BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);
```

#### Story Nodes Table
```sql
CREATE TABLE story_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    parent_node_id UUID REFERENCES story_nodes(id),
    position_order INTEGER DEFAULT 0,
    sync_id VARCHAR(100), -- For dual perspectives
    sync_offset INTEGER DEFAULT 0,
    node_type VARCHAR(50) DEFAULT 'story', -- story, choice, ending
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_story_nodes_story_id (story_id),
    INDEX idx_story_nodes_sync_id (sync_id),
    INDEX idx_story_nodes_parent (parent_node_id)
);
```

#### Story Branches Table
```sql
CREATE TABLE story_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    from_node_id UUID REFERENCES story_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES story_nodes(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,
    branch_type VARCHAR(50), -- character-driven, plot-twist, moral-dilemma, etc.
    impact_score DECIMAL(3,2) DEFAULT 0.50,
    selection_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_branches_from_node (from_node_id),
    INDEX idx_branches_to_node (to_node_id),
    INDEX idx_branches_story (story_id)
);
```

### Character & Setting Tables

#### Characters Table
```sql
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    traits JSONB DEFAULT '[]', -- Array of trait strings
    description TEXT,
    avatar_url VARCHAR(500),
    is_protagonist BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_characters_story_id (story_id)
);
```

#### Settings Table
```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    era VARCHAR(100),
    place VARCHAR(200),
    mood VARCHAR(50),
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_settings_story_id (story_id)
);
```

### Simulator & Templates

#### Prompt Templates Table
```sql
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- logical, creative, character-driven, etc.
    template_text TEXT NOT NULL,
    parameters JSONB DEFAULT '{}', -- Required parameters
    constraints JSONB DEFAULT '{}', -- Genre, tone constraints
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0.50,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_templates_category (category),
    INDEX idx_templates_effectiveness (effectiveness_score)
);
```

#### Generated Prompts Table
```sql
CREATE TABLE generated_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    prompt_text TEXT NOT NULL,
    prompt_type VARCHAR(50), -- logical, creative, twist, character, thematic
    input_parameters JSONB NOT NULL,
    generation_method VARCHAR(50), -- rule-based, llm, hybrid
    template_used UUID REFERENCES prompt_templates(id),
    impact_score DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    was_accepted BOOLEAN DEFAULT false,
    was_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_prompts_story_id (story_id),
    INDEX idx_prompts_user_id (user_id),
    INDEX idx_prompts_type (prompt_type)
);
```

### Analytics & Moderation

#### User Analytics Table
```sql
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- story_created, prompt_generated, branch_selected, etc.
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_analytics_user_id (user_id),
    INDEX idx_analytics_story_id (story_id),
    INDEX idx_analytics_event_type (event_type),
    INDEX idx_analytics_created_at (created_at)
);
```

#### Content Moderation Table
```sql
CREATE TABLE content_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL, -- story_node, generated_prompt, user_input
    content_id UUID NOT NULL, -- References various content tables
    content_text TEXT NOT NULL,
    safety_score DECIMAL(3,2),
    flagged_categories JSONB DEFAULT '[]', -- toxicity, sexual, hate_speech, etc.
    moderation_status VARCHAR(50) DEFAULT 'pending', -- approved, rejected, flagged, reviewing
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    auto_flagged_at TIMESTAMP DEFAULT NOW(),
    user_reported BOOLEAN DEFAULT false,
    
    INDEX idx_moderation_content_type (content_type),
    INDEX idx_moderation_status (moderation_status),
    INDEX idx_moderation_safety_score (safety_score)
);
```

### Relationship Tables

#### Story Collaborators Table
```sql
CREATE TABLE story_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'contributor', -- owner, editor, contributor, reader
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(story_id, user_id),
    INDEX idx_collaborators_story_id (story_id),
    INDEX idx_collaborators_user_id (user_id)
);
```

#### Story Tags Table
```sql
CREATE TABLE story_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(story_id, tag),
    INDEX idx_story_tags_story_id (story_id),
    INDEX idx_story_tags_tag (tag)
);
```

## Application Folder Structure

```
what-if-simulator/
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── frontend/                          # React/Next.js Frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── public/
│   │   ├── icons/
│   │   ├── images/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── story/
│   │   │   │   ├── StoryEditor.tsx
│   │   │   │   ├── NodeEditor.tsx
│   │   │   │   ├── BranchViewer.tsx
│   │   │   │   └── TimelineView.tsx
│   │   │   ├── simulator/
│   │   │   │   ├── PromptLab.tsx
│   │   │   │   ├── ParameterForm.tsx
│   │   │   │   ├── PromptResults.tsx
│   │   │   │   └── SimulatorPanel.tsx
│   │   │   └── auth/
│   │   │       ├── LoginForm.tsx
│   │   │       ├── RegisterForm.tsx
│   │   │       └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── index.tsx              # Home page
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── stories/
│   │   │   │   ├── index.tsx          # Story list
│   │   │   │   ├── [id].tsx           # Story detail
│   │   │   │   ├── create.tsx         # New story
│   │   │   │   └── edit/[id].tsx      # Edit story
│   │   │   └── api/                   # API routes (if using Next.js)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useStory.ts
│   │   │   ├── useSimulator.ts
│   │   │   └── useAnalytics.ts
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── StoryContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   ├── api.ts                 # API client
│   │   │   ├── authService.ts
│   │   │   ├── storyService.ts
│   │   │   └── simulatorService.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── story.ts
│   │   │   ├── simulator.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   ├── validation.ts
│   │   │   └── formatting.ts
│   │   └── styles/
│   │       ├── globals.css
│   │       └── components.css
│   └── tests/
│       ├── components/
│       ├── pages/
│       ├── utils/
│       └── __mocks__/
│
├── backend/                           # Node.js/Express Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   ├── jest.config.js
│   ├── src/
│   │   ├── app.ts                     # Express app setup
│   │   ├── server.ts                  # Server entry point
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── storyController.ts
│   │   │   ├── simulatorController.ts
│   │   │   └── analyticsController.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── storyService.ts
│   │   │   ├── simulatorService.ts
│   │   │   ├── templateService.ts
│   │   │   ├── llmService.ts          # LLM integration
│   │   │   ├── moderationService.ts
│   │   │   └── analyticsService.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Story.ts
│   │   │   ├── StoryNode.ts
│   │   │   ├── StoryBranch.ts
│   │   │   ├── Character.ts
│   │   │   ├── Setting.ts
│   │   │   └── PromptTemplate.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── rateLimit.ts
│   │   │   ├── cors.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── stories.ts
│   │   │   ├── simulator.ts
│   │   │   └── analytics.ts
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   │   ├── 001_initial_schema.sql
│   │   │   │   ├── 002_add_analytics.sql
│   │   │   │   └── 003_add_moderation.sql
│   │   │   ├── seeds/
│   │   │   │   ├── users.sql
│   │   │   │   ├── prompt_templates.sql
│   │   │   │   └── sample_stories.sql
│   │   │   └── queries/
│   │   │       ├── storyQueries.ts
│   │   │       ├── userQueries.ts
│   │   │       └── analyticsQueries.ts
│   │   ├── simulator/
│   │   │   ├── core/
│   │   │   │   ├── SimulatorEngine.ts
│   │   │   │   ├── LogicalGenerator.ts
│   │   │   │   ├── CreativeGenerator.ts
│   │   │   │   └── RankingAlgorithm.ts
│   │   │   ├── templates/
│   │   │   │   ├── TemplateManager.ts
│   │   │   │   ├── SlotFiller.ts
│   │   │   │   └── templateLibrary.json
│   │   │   ├── nlp/
│   │   │   │   ├── EntityExtractor.ts
│   │   │   │   ├── DependencyParser.ts
│   │   │   │   └── EmbeddingService.ts
│   │   │   └── safety/
│   │   │       ├── ContentFilter.ts
│   │   │       ├── ToxicityDetector.ts
│   │   │       └── AgeAppropriateFilter.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── story.ts
│   │   │   ├── simulator.ts
│   │   │   ├── database.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   ├── validation.ts
│   │   │   └── encryption.ts
│   │   └── config/
│   │       ├── database.ts
│   │       ├── auth.ts
│   │       ├── llm.ts
│   │       └── environment.ts
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── simulator/
│       └── fixtures/
│
├── shared/                            # Shared types and utilities
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── types/
│   │   │   ├── story.ts
│   │   │   ├── user.ts
│   │   │   ├── simulator.ts
│   │   │   └── api.ts
│   │   ├── constants/
│   │   │   ├── genres.ts
│   │   │   ├── tones.ts
│   │   │   └── branchTypes.ts
│   │   ├── validators/
│   │   │   ├── storyValidators.ts
│   │   │   ├── userValidators.ts
│   │   │   └── simulatorValidators.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       ├── parsers.ts
│   │       └── helpers.ts
│   └── tests/
│
├── database/                          # Database-specific files
│   ├── docker-compose.yml            # PostgreSQL setup
│   ├── init/
│   │   ├── 00-create-database.sql
│   │   └── 01-create-extensions.sql
│   ├── backups/
│   └── scripts/
│       ├── backup.sh
│       ├── restore.sh
│       └── migrate.sh
│
├── docs/                             # Documentation
│   ├── Context.md                    # This file
│   ├── API.md                        # API documentation
│   ├── DEPLOYMENT.md                 # Deployment guide
│   ├── DEVELOPMENT.md                # Development setup
│   ├── DATABASE.md                   # Database schema docs
│   └── architecture/
│       ├── system-design.md
│       ├── database-design.md
│       └── api-design.md
│
├── infrastructure/                   # DevOps and deployment
│   ├── docker/
│   │   ├── frontend.Dockerfile
│   │   ├── backend.Dockerfile
│   │   └── nginx.Dockerfile
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── backend-deployment.yaml
│   │   └── database-deployment.yaml
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── scripts/
│       ├── deploy.sh
│       ├── rollback.sh
│       └── health-check.sh
│
├── scripts/                          # Utility scripts
│   ├── setup.sh                     # Initial project setup
│   ├── seed-data.sh                 # Database seeding
│   ├── run-tests.sh                 # Test runner
│   └── build.sh                     # Build script
│
└── tools/                           # Development tools
    ├── data-generator/              # Test data generation
    ├── performance-testing/         # Load testing tools
    ├── migration-tools/             # Database migration utilities
    └── monitoring/                  # Application monitoring setup
```

### Key Architecture Decisions

| Component | Technology Choice | Reasoning |
|-----------|------------------|-----------|
| **Frontend** | React/Next.js + TypeScript | Modern, performant, great DX |
| **Backend** | Node.js + Express + TypeScript | JavaScript ecosystem, fast development |
| **Database** | PostgreSQL | JSONB support, ACID compliance, scalability |
| **Authentication** | JWT + bcrypt | Stateless, secure, scalable |
| **Real-time Features** | WebSockets/Socket.io | Live collaboration support |
| **File Storage** | AWS S3/CloudFront | Scalable asset storage and CDN |
| **Deployment** | Docker + Kubernetes | Container orchestration, scalability |

### Environment Structure

```bash
# Development
npm run dev:frontend    # Frontend dev server
npm run dev:backend     # Backend dev server
npm run dev:db         # Local database

# Testing  
npm run test:unit      # Unit tests
npm run test:integration # Integration tests
npm run test:e2e       # End-to-end tests

# Production
npm run build         # Build all services
npm run deploy:staging # Deploy to staging
npm run deploy:prod   # Deploy to production
```

---

**End of What-If Storytelling Simulator Specification**
