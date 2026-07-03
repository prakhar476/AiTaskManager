"""
AI Task Manager — NLP Engine
Handles task categorization, priority scoring, keyword extraction,
sentiment analysis, and smart suggestions using spaCy + scikit-learn.
"""

import re
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ─── Category keyword mapping ────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    'Development': {
        'keywords': [
            'code', 'bug', 'feature', 'deploy', 'api', 'database', 'frontend',
            'backend', 'test', 'refactor', 'debug', 'fix', 'implement', 'build',
            'integration', 'python', 'javascript', 'react', 'django', 'git',
            'pull request', 'merge', 'branch', 'function', 'class', 'module',
            'framework', 'library', 'dependency', 'docker', 'kubernetes'
        ],
        'color': '#3b82f6',
        'icon': 'code'
    },
    'Design': {
        'keywords': [
            'ui', 'ux', 'design', 'figma', 'wireframe', 'mockup', 'prototype',
            'layout', 'typography', 'color', 'icon', 'logo', 'brand', 'visual',
            'sketch', 'photoshop', 'illustrator', 'animation', 'responsive',
            'accessibility', 'interface', 'component', 'stylesheet', 'css'
        ],
        'color': '#ec4899',
        'icon': 'palette'
    },
    'Marketing': {
        'keywords': [
            'campaign', 'seo', 'content', 'social media', 'email', 'analytics',
            'conversion', 'audience', 'engagement', 'traffic', 'advertising',
            'blog', 'newsletter', 'promotion', 'brand awareness', 'funnel',
            'leads', 'growth', 'metrics', 'keyword research', 'copywriting'
        ],
        'color': '#f59e0b',
        'icon': 'trending-up'
    },
    'Research': {
        'keywords': [
            'research', 'study', 'analyze', 'investigate', 'survey', 'data',
            'findings', 'literature', 'review', 'hypothesis', 'experiment',
            'report', 'benchmark', 'competitive analysis', 'user interview',
            'feedback', 'explore', 'discover', 'evaluate', 'compare'
        ],
        'color': '#8b5cf6',
        'icon': 'search'
    },
    'Meeting': {
        'keywords': [
            'meeting', 'call', 'standup', 'sync', 'presentation', 'demo',
            'discussion', 'review', 'interview', 'onboarding', 'workshop',
            'conference', 'webinar', 'zoom', 'teams', 'calendar', 'schedule',
            'agenda', 'minutes', 'action items', 'follow-up', 'check-in'
        ],
        'color': '#14b8a6',
        'icon': 'users'
    },
    'Operations': {
        'keywords': [
            'process', 'workflow', 'documentation', 'policy', 'procedure',
            'infrastructure', 'maintenance', 'monitoring', 'backup', 'security',
            'compliance', 'audit', 'setup', 'configuration', 'migration',
            'update', 'upgrade', 'patch', 'incident', 'support', 'ticket'
        ],
        'color': '#6366f1',
        'icon': 'settings'
    },
    'Finance': {
        'keywords': [
            'budget', 'invoice', 'payment', 'expense', 'revenue', 'cost',
            'financial', 'accounting', 'tax', 'billing', 'subscription',
            'contract', 'negotiation', 'pricing', 'roi', 'forecast', 'profit'
        ],
        'color': '#10b981',
        'icon': 'dollar-sign'
    },
    'Personal': {
        'keywords': [
            'personal', 'health', 'fitness', 'learning', 'book', 'course',
            'goal', 'habit', 'routine', 'family', 'travel', 'shopping',
            'appointment', 'reminder', 'errand', 'grocery', 'workout'
        ],
        'color': '#f97316',
        'icon': 'user'
    }
}

# ─── Priority scoring signals ────────────────────────────────────────────────
URGENCY_SIGNALS = {
    'critical': ['asap', 'urgent', 'critical', 'immediately', 'emergency', 'blocker', 'p0', 'p1'],
    'high': ['important', 'high priority', 'deadline', 'today', 'overdue', 'must', 'required'],
    'medium': ['soon', 'this week', 'moderate', 'normal', 'standard', 'when possible'],
    'low': ['nice to have', 'low priority', 'eventually', 'backlog', 'someday', 'minor'],
}

POSITIVE_SENTIMENT = ['complete', 'finish', 'done', 'accomplish', 'achieve', 'success', 'great']
NEGATIVE_SENTIMENT = ['broken', 'failed', 'error', 'problem', 'issue', 'bug', 'urgent', 'stuck']


class NLPEngine:
    """
    Core NLP processing engine.
    Provides categorization, priority scoring, keyword extraction,
    and smart suggestions without heavy model dependencies at startup.
    """

    def __init__(self):
        self._spacy_model = None
        self._tfidf = None
        self._category_vectors = None
        self._build_category_index()

    def _build_category_index(self):
        """Pre-compute category keyword sets for fast lookup."""
        self._category_index = {}
        for cat_name, cat_data in CATEGORY_KEYWORDS.items():
            keywords = set(cat_data['keywords'])
            # Add bigrams and partial matches
            self._category_index[cat_name] = keywords

    def _get_spacy(self):
        """Lazy-load spaCy model."""
        if self._spacy_model is None:
            try:
                import spacy
                self._spacy_model = spacy.load('en_core_web_sm')
            except Exception:
                logger.warning("spaCy model not available, using fallback NLP")
                self._spacy_model = False
        return self._spacy_model if self._spacy_model else None

    def preprocess(self, text: str) -> str:
        """Normalize text for analysis."""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s\-]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract meaningful keywords from text."""
        nlp = self._get_spacy()
        keywords = []

        if nlp:
            doc = nlp(text)
            # Extract noun phrases and named entities
            for chunk in doc.noun_chunks:
                if len(chunk.text) > 2:
                    keywords.append(chunk.text.lower())
            for ent in doc.ents:
                keywords.append(ent.text.lower())
            # Extract important tokens
            for token in doc:
                if (not token.is_stop and not token.is_punct
                        and token.pos_ in ('NOUN', 'VERB', 'ADJ', 'PROPN')
                        and len(token.text) > 2):
                    keywords.append(token.lemma_.lower())
        else:
            # Fallback: simple word extraction
            words = re.findall(r'\b[a-z]{3,}\b', text.lower())
            stop_words = {'the', 'and', 'for', 'with', 'this', 'that', 'have',
                          'will', 'from', 'are', 'was', 'were', 'been', 'has'}
            keywords = [w for w in words if w not in stop_words]

        # Deduplicate while preserving order
        seen = set()
        unique_keywords = []
        for kw in keywords:
            if kw not in seen:
                seen.add(kw)
                unique_keywords.append(kw)

        return unique_keywords[:max_keywords]

    def categorize(self, title: str, description: str = '') -> Dict:
        """
        Auto-categorize a task using keyword matching + NLP.
        Returns category name, confidence score, and candidates.
        """
        text = self.preprocess(f"{title} {description}")
        words = set(re.findall(r'\b\w+\b', text))
        bigrams = set()
        word_list = text.split()
        for i in range(len(word_list) - 1):
            bigrams.add(f"{word_list[i]} {word_list[i+1]}")

        scores: Dict[str, float] = {}

        for cat_name, cat_keywords in self._category_index.items():
            score = 0.0
            matched_keywords = []

            for kw in cat_keywords:
                if ' ' in kw:  # bigram
                    if kw in text:
                        score += 2.0
                        matched_keywords.append(kw)
                else:  # unigram
                    if kw in words:
                        score += 1.0
                        matched_keywords.append(kw)
                    elif any(kw in w for w in words if len(w) > len(kw)):
                        score += 0.5

            if score > 0:
                scores[cat_name] = score

        if not scores:
            return {
                'category': 'Personal',
                'confidence': 0.1,
                'candidates': [],
                'matched_keywords': []
            }

        # Normalize scores
        max_score = max(scores.values())
        normalized = {k: v / max_score for k, v in scores.items()}

        # Sort and pick best
        sorted_cats = sorted(normalized.items(), key=lambda x: x[1], reverse=True)
        best_cat, best_score = sorted_cats[0]

        return {
            'category': best_cat,
            'confidence': round(min(best_score, 1.0), 3),
            'candidates': [{'name': c, 'score': round(s, 3)} for c, s in sorted_cats[:3]],
            'color': CATEGORY_KEYWORDS[best_cat]['color'],
            'icon': CATEGORY_KEYWORDS[best_cat]['icon'],
        }

    def score_priority(
        self,
        title: str,
        description: str = '',
        due_date: Optional[datetime] = None,
        user_priority: int = 3
    ) -> Dict:
        """
        AI priority score combining NLP signals + deadline urgency.
        Returns a 0-1 score (higher = more urgent).
        """
        text = self.preprocess(f"{title} {description}")
        score = 0.0
        signals = []

        # Keyword-based urgency
        for level, words in URGENCY_SIGNALS.items():
            for word in words:
                if word in text:
                    urgency_map = {'critical': 0.4, 'high': 0.3, 'medium': 0.2, 'low': 0.1}
                    score += urgency_map[level]
                    signals.append({'type': 'keyword', 'value': word, 'level': level})
                    break

        # Due date proximity
        if due_date:
            from django.utils import timezone
            now = timezone.now()
            delta = due_date - now
            days = delta.total_seconds() / 86400

            if days < 0:      # Overdue
                score += 0.5
                signals.append({'type': 'deadline', 'value': 'overdue'})
            elif days < 1:    # Due today
                score += 0.4
                signals.append({'type': 'deadline', 'value': 'due_today'})
            elif days < 3:
                score += 0.3
                signals.append({'type': 'deadline', 'value': 'due_soon'})
            elif days < 7:
                score += 0.2
                signals.append({'type': 'deadline', 'value': 'due_this_week'})
            elif days < 14:
                score += 0.1
                signals.append({'type': 'deadline', 'value': 'due_next_week'})

        # User-assigned priority (normalized)
        priority_weight = (6 - user_priority) / 5.0 * 0.3  # 1=Critical→0.3, 5=Minimal→0.06
        score += priority_weight

        # Clamp
        final_score = min(score, 1.0)

        return {
            'score': round(final_score, 3),
            'signals': signals,
            'suggested_priority': self._score_to_priority(final_score),
        }

    def _score_to_priority(self, score: float) -> int:
        """Convert AI score to priority integer."""
        if score >= 0.8: return 1   # Critical
        if score >= 0.6: return 2   # High
        if score >= 0.4: return 3   # Medium
        if score >= 0.2: return 4   # Low
        return 5                     # Minimal

    def analyze_sentiment(self, text: str) -> str:
        """Simple sentiment classification for task tone."""
        text_lower = text.lower()
        pos = sum(1 for w in POSITIVE_SENTIMENT if w in text_lower)
        neg = sum(1 for w in NEGATIVE_SENTIMENT if w in text_lower)

        if neg > pos:
            return 'negative'
        elif pos > neg:
            return 'positive'
        return 'neutral'

    def generate_suggestions(self, task_title: str, task_description: str, context_tasks: List[Dict] = None) -> List[Dict]:
        """
        Generate smart suggestions for a task:
        - Sub-task breakdown
        - Related tasks from user's history
        - Estimated time
        """
        text = self.preprocess(f"{task_title} {task_description}")
        suggestions = []

        # Time estimation based on task type
        time_estimates = {
            'bug': 60, 'feature': 240, 'design': 180, 'meeting': 60,
            'research': 120, 'review': 45, 'documentation': 90, 'deployment': 30,
            'test': 90, 'refactor': 120, 'fix': 45, 'implement': 180,
        }
        for keyword, minutes in time_estimates.items():
            if keyword in text:
                suggestions.append({
                    'type': 'time_estimate',
                    'content': f'Estimated time: ~{minutes} minutes',
                    'value': minutes,
                    'confidence': 0.7
                })
                break

        # Subtask suggestions based on common patterns
        subtask_patterns = {
            'feature': ['Create wireframes', 'Write tests', 'Implement logic', 'Code review', 'Deploy'],
            'bug': ['Reproduce issue', 'Identify root cause', 'Write fix', 'Add regression test', 'Deploy fix'],
            'design': ['Gather requirements', 'Create mockups', 'Get feedback', 'Finalize design', 'Handoff to dev'],
            'research': ['Define scope', 'Gather sources', 'Analyze data', 'Write summary', 'Present findings'],
            'meeting': ['Prepare agenda', 'Send invites', 'Run meeting', 'Write notes', 'Follow up on action items'],
        }
        for pattern_key, subtasks in subtask_patterns.items():
            if pattern_key in text:
                suggestions.append({
                    'type': 'subtasks',
                    'content': f'Suggested subtasks for {pattern_key}',
                    'value': subtasks,
                    'confidence': 0.8
                })
                break

        # Tag suggestions
        extracted_keywords = self.extract_keywords(task_title, max_keywords=5)
        if extracted_keywords:
            suggestions.append({
                'type': 'tags',
                'content': 'Suggested tags based on content',
                'value': extracted_keywords[:3],
                'confidence': 0.6
            })

        return suggestions

    def batch_process(self, tasks: List[Dict]) -> List[Dict]:
        """Process multiple tasks at once."""
        results = []
        for task in tasks:
            result = self.process_task(
                title=task.get('title', ''),
                description=task.get('description', ''),
                due_date=task.get('due_date'),
                user_priority=task.get('priority', 3)
            )
            result['task_id'] = task.get('id')
            results.append(result)
        return results

    def process_task(
        self,
        title: str,
        description: str = '',
        due_date: Optional[datetime] = None,
        user_priority: int = 3
    ) -> Dict:
        """Full NLP processing pipeline for a single task."""
        categorization = self.categorize(title, description)
        priority_analysis = self.score_priority(title, description, due_date, user_priority)
        keywords = self.extract_keywords(f"{title} {description}")
        sentiment = self.analyze_sentiment(f"{title} {description}")
        suggestions = self.generate_suggestions(title, description)

        return {
            'category': categorization['category'],
            'category_confidence': categorization['confidence'],
            'category_color': categorization.get('color', '#6366f1'),
            'category_icon': categorization.get('icon', 'folder'),
            'priority_score': priority_analysis['score'],
            'suggested_priority': priority_analysis['suggested_priority'],
            'priority_signals': priority_analysis['signals'],
            'keywords': keywords,
            'sentiment': sentiment,
            'suggestions': suggestions,
            'candidates': categorization.get('candidates', []),
        }


# ─── Singleton instance ───────────────────────────────────────────────────────
_engine_instance = None

def get_nlp_engine() -> NLPEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = NLPEngine()
    return _engine_instance
