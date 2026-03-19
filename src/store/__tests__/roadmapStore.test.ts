import { useRoadmapStore } from '../roadmapStore'
import type { Activity, Project } from '@/types'

// Helper to reset zustand store between tests
const resetStore = () => {
  useRoadmapStore.setState({
    project: null,
    activities: [],
    timeView: 'month',
    activeTagFilter: null,
    dragPreview: null,
  })
}

const makeActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'act-1',
  name: 'Test Activity',
  color: '#6366f1',
  durationSprints: 1,
  startDate: null,
  rowIndex: null,
  isDelivered: false,
  deliveryDate: null,
  deliveryLabel: null,
  projectId: 'proj-1',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  color: '#6366f1',
  sprintDuration: 14,
  startDate: new Date(),
  ownerId: 'user-1',
  activities: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('roadmapStore', () => {
  beforeEach(resetStore)

  describe('setProject', () => {
    it('should set project and activities', () => {
      const activities = [makeActivity()]
      const project = makeProject({ activities })

      useRoadmapStore.getState().setProject(project)

      expect(useRoadmapStore.getState().project).toEqual(project)
      expect(useRoadmapStore.getState().activities).toEqual(activities)
    })
  })

  describe('setActivities', () => {
    it('should replace activities array', () => {
      const activities = [makeActivity(), makeActivity({ id: 'act-2', name: 'Second' })]
      useRoadmapStore.getState().setActivities(activities)
      expect(useRoadmapStore.getState().activities).toHaveLength(2)
    })
  })

  describe('setTimeView', () => {
    it('should update time view', () => {
      useRoadmapStore.getState().setTimeView('quarter')
      expect(useRoadmapStore.getState().timeView).toBe('quarter')
    })
  })

  describe('setTagFilter', () => {
    it('should set and clear tag filter', () => {
      useRoadmapStore.getState().setTagFilter('frontend')
      expect(useRoadmapStore.getState().activeTagFilter).toBe('frontend')

      useRoadmapStore.getState().setTagFilter(null)
      expect(useRoadmapStore.getState().activeTagFilter).toBeNull()
    })
  })

  describe('setDragPreview', () => {
    it('should set drag preview', () => {
      const preview = { activityId: 'act-1', previewStartDate: new Date(), previewRowIndex: 0 }
      useRoadmapStore.getState().setDragPreview(preview)
      expect(useRoadmapStore.getState().dragPreview).toEqual(preview)
    })

    it('should clear drag preview', () => {
      useRoadmapStore.getState().setDragPreview(null)
      expect(useRoadmapStore.getState().dragPreview).toBeNull()
    })
  })

  describe('addActivity', () => {
    it('should add activity to the list', () => {
      const activity = makeActivity()
      useRoadmapStore.getState().addActivity(activity)
      expect(useRoadmapStore.getState().activities).toHaveLength(1)
      expect(useRoadmapStore.getState().activities[0]).toEqual(activity)
    })

    it('should append to existing activities', () => {
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'act-1' }))
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'act-2' }))
      expect(useRoadmapStore.getState().activities).toHaveLength(2)
    })
  })

  describe('updateActivity', () => {
    it('should update existing activity', () => {
      useRoadmapStore.getState().addActivity(makeActivity())
      useRoadmapStore.getState().updateActivity('act-1', { name: 'Updated' })
      expect(useRoadmapStore.getState().activities[0].name).toBe('Updated')
    })

    it('should not fail for non-existent activity', () => {
      expect(() => {
        useRoadmapStore.getState().updateActivity('nonexistent', { name: 'X' })
      }).not.toThrow()
    })

    it('should update multiple fields', () => {
      useRoadmapStore.getState().addActivity(makeActivity())
      useRoadmapStore.getState().updateActivity('act-1', {
        name: 'Updated',
        color: '#ff0000',
        durationSprints: 3,
      })
      const act = useRoadmapStore.getState().activities[0]
      expect(act.name).toBe('Updated')
      expect(act.color).toBe('#ff0000')
      expect(act.durationSprints).toBe(3)
    })
  })

  describe('removeActivity', () => {
    it('should remove activity by id', () => {
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'act-1' }))
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'act-2' }))
      useRoadmapStore.getState().removeActivity('act-1')
      expect(useRoadmapStore.getState().activities).toHaveLength(1)
      expect(useRoadmapStore.getState().activities[0].id).toBe('act-2')
    })
  })

  describe('scheduleActivity', () => {
    it('should set startDate and rowIndex', () => {
      useRoadmapStore.getState().addActivity(makeActivity())
      const date = new Date(2025, 5, 1)
      useRoadmapStore.getState().scheduleActivity('act-1', date, 2)
      const act = useRoadmapStore.getState().activities[0]
      expect(act.startDate).toEqual(date)
      expect(act.rowIndex).toBe(2)
    })
  })

  describe('unscheduleActivity', () => {
    it('should clear startDate and rowIndex', () => {
      useRoadmapStore.getState().addActivity(makeActivity({
        startDate: new Date(),
        rowIndex: 3,
      }))
      useRoadmapStore.getState().unscheduleActivity('act-1')
      const act = useRoadmapStore.getState().activities[0]
      expect(act.startDate).toBeNull()
      expect(act.rowIndex).toBeNull()
    })
  })

  describe('getScheduledActivities', () => {
    it('should return only activities with startDate', () => {
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'a1', startDate: new Date() }))
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'a2', startDate: null }))
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'a3', startDate: new Date() }))

      const scheduled = useRoadmapStore.getState().getScheduledActivities()
      expect(scheduled).toHaveLength(2)
    })
  })

  describe('getUnscheduledActivities', () => {
    it('should return only activities without startDate', () => {
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'a1', startDate: new Date() }))
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'a2', startDate: null }))

      const unscheduled = useRoadmapStore.getState().getUnscheduledActivities()
      expect(unscheduled).toHaveLength(1)
      expect(unscheduled[0].id).toBe('a2')
    })
  })

  describe('getFilteredActivities', () => {
    it('should return all activities when no filter set', () => {
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'a1' }))
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'a2' }))

      const filtered = useRoadmapStore.getState().getFilteredActivities()
      expect(filtered).toHaveLength(2)
    })

    it('should filter by tag name', () => {
      useRoadmapStore.getState().addActivity(makeActivity({
        id: 'a1',
        tags: [{ id: 't1', name: 'frontend', color: '#f00', activityId: 'a1' }],
      }))
      useRoadmapStore.getState().addActivity(makeActivity({
        id: 'a2',
        tags: [{ id: 't2', name: 'backend', color: '#0f0', activityId: 'a2' }],
      }))

      useRoadmapStore.getState().setTagFilter('frontend')
      const filtered = useRoadmapStore.getState().getFilteredActivities()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('a1')
    })

    it('should return empty when no activities match filter', () => {
      useRoadmapStore.getState().addActivity(makeActivity({ id: 'a1', tags: [] }))
      useRoadmapStore.getState().setTagFilter('nonexistent')

      const filtered = useRoadmapStore.getState().getFilteredActivities()
      expect(filtered).toHaveLength(0)
    })
  })
})
