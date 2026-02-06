"use client";

import { useState, useMemo } from "react";
import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { VoicePart } from "@/prisma/generated/enums";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  voicePart: VoicePart;
  instrument: string | null;
  score: number;
  isMeetingTarget: boolean;
}

interface EventParticipantsTableProps {
  participants: Participant[];
  isLoading: boolean;
  passMark: number;
  currentUserId?: string;
  onViewParticipant: (participantId: string, name: string) => void;
}

export function EventParticipantsTable({
  participants,
  isLoading,
  passMark,
  currentUserId,
  onViewParticipant,
}: EventParticipantsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoicePart, setSelectedVoicePart] = useState<string>("all");

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.instrument?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesVoicePart =
        selectedVoicePart === "all" || p.voicePart === selectedVoicePart;

      return matchesSearch && matchesVoicePart;
    });
  }, [participants, searchTerm, selectedVoicePart]);

  const voiceParts = Array.from(
    new Set(participants.map((p) => p.voicePart))
  ).sort();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-60 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input
            placeholder="Search by name or instrument..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
        <Select value={selectedVoicePart} onValueChange={setSelectedVoicePart}>
          <SelectTrigger className="w-40 bg-background border-border">
            <SelectValue placeholder="Voice Part" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Voice Parts</SelectItem>
            {voiceParts.map((part) => (
              <SelectItem key={part} value={part}>
                {part}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Participants List */}
      <div className="space-y-2">
        {filteredParticipants.length > 0 ? (
          filteredParticipants.map((participant) => {
            const isCurrentUser = currentUserId === participant.id;
            return (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
                  isCurrentUser
                    ? "bg-primary/5 border-2 border-primary/50 hover:border-primary"
                    : "bg-card border border-border hover:border-primary/50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {participant.firstName} {participant.lastName}
                    </p>
                    <span className="text-xs font-semibold text-primary/70 bg-primary/10 px-2 py-0.5 rounded shrink-0">
                      {participant.voicePart}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-text-secondary truncate">
                      {participant.email}
                    </p>
                    {participant.instrument && (
                      <>
                        <span className="w-1 h-1 bg-border rounded-full" />
                        <p className="text-xs text-text-secondary">
                          {participant.instrument}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="mt-2">
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                        participant.isMeetingTarget
                          ? "text-primary bg-primary/10"
                          : "text-orange-600 dark:text-orange-400 bg-orange-600/10"
                      }`}
                    >
                      {participant.isMeetingTarget ? "✓" : "⏱"} Score:{" "}
                    {participant.score}% (Target: {passMark}%)
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    onViewParticipant(
                      participant.id,
                      `${participant.firstName} ${participant.lastName}`
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="shrink-0 ml-2 bg-primary text-foreground border-0 hover:bg-primary/90 font-semibold gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-text-secondary">
              {participants.length === 0
                ? "No participants found"
                : "No matching participants"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
