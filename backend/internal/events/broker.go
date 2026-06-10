package events

import (
	"sync"
)

type TaskEvent struct {
	Type   string      `json:"type"`
	Task   interface{} `json:"task,omitempty"`
	TaskID string      `json:"task_id,omitempty"`
}

type Broker struct {
	mu      sync.RWMutex
	clients map[string][]chan TaskEvent
}

func NewBroker() *Broker {
	return &Broker{clients: make(map[string][]chan TaskEvent)}
}

func (b *Broker) Subscribe(userID string) chan TaskEvent {
	ch := make(chan TaskEvent, 16)
	b.mu.Lock()
	b.clients[userID] = append(b.clients[userID], ch)
	b.mu.Unlock()
	return ch
}

func (b *Broker) Unsubscribe(userID string, ch chan TaskEvent) {
	b.mu.Lock()
	defer b.mu.Unlock()
	channels := b.clients[userID]
	for i, c := range channels {
		if c == ch {
			b.clients[userID] = append(channels[:i], channels[i+1:]...)
			close(ch)
			return
		}
	}
}

func (b *Broker) Publish(userID string, event TaskEvent) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for _, ch := range b.clients[userID] {
		select {
		case ch <- event:
		default:
		}
	}
}
